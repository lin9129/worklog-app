import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';

// GET /api/products/barcode?ids=1,2,3 - 選択された商品のバーコードPDFラベルシートを生成
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsStr = searchParams.get('ids');

    let products = [];
    if (idsStr) {
      const ids = idsStr.split(',')
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));
      
      products = await db.product.findMany({
        where: { id: { in: ids } },
      });
    } else {
      // idsが指定されていない場合は全商品を出力
      products = await db.product.findMany({
        orderBy: { id: 'asc' },
      });
    }

    if (products.length === 0) {
      return NextResponse.json({ error: '印刷対象の商品が選択されていません。' }, { status: 400 });
    }

    // A4サイズ (595.28 x 841.89 pt) のPDFを作成
    const doc = new PDFDocument({
      size: 'A4',
      margin: 30,
    });

    const buffers: Buffer[] = [];
    doc.on('data', chunk => buffers.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));
    });

    // Windows標準の日本語フォントを設定 (文字化け防止)
    try {
      doc.font('C:/Windows/Fonts/msgothic.ttc');
    } catch (e) {
      console.warn("System Japanese font (msgothic.ttc) not found, falling back to default.", e);
    }

    // ラベルのグリッド配置設計 (A4縦に3列 x 6行 = 18枚/ページ)
    const cols = 3;
    const rows = 6;
    const labelWidth = 178;  // (595 - 60) / 3
    const labelHeight = 130; // (842 - 60) / 6
    const startX = 30;
    const startY = 30;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const innerIndex = i % (cols * rows);
      const col = innerIndex % cols;
      const row = Math.floor(innerIndex / cols);

      // 改ページ判定
      if (i > 0 && innerIndex === 0) {
        doc.addPage();
      }

      const x = startX + col * labelWidth;
      const y = startY + row * labelHeight;

      // ラベルの外枠線
      doc.rect(x + 4, y + 4, labelWidth - 8, labelHeight - 8)
        .lineWidth(0.5)
        .stroke('#cccccc');

      // 商品名 (最大22文字でトリミング)
      let displayName = p.name;
      if (displayName.length > 22) {
        displayName = displayName.substring(0, 21) + '...';
      }
      doc.fontSize(9)
        .fillColor('#2d3748')
        .text(displayName, x + 10, y + 10, { width: labelWidth - 20, align: 'left' });

      // 保管場所 (棚番)
      const locText = p.location ? `棚: ${p.location}` : '棚未設定';
      doc.fontSize(8)
        .fillColor('#3182ce')
        .text(locText, x + 10, y + 25, { width: labelWidth - 20 });

      // バーコード生成と埋め込み (bwip-js)
      try {
        const pngBuffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: p.code,
          scale: 2,
          height: 12, // mm
          includetext: false, // コードは下に別途テキストで描画するため非表示
        });

        // バーコード画像をラベル内に配置
        doc.image(pngBuffer, x + 15, y + 40, {
          width: labelWidth - 30,
          height: 48,
        });
      } catch (err) {
        console.error(`Barcode generation failed for ${p.code}:`, err);
        doc.fontSize(8)
          .fillColor('#e53e3e')
          .text('バーコード生成エラー', x + 15, y + 55, { align: 'center' });
      }

      // 商品コードのテキスト (バーコードの下に表示)
      doc.fontSize(8)
        .fillColor('#4a5568')
        .text(p.code, x + 10, y + 95, { width: labelWidth - 20, align: 'center' });
    }

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=barcodes_${Date.now()}.pdf`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('GET /api/products/barcode failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
