import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ExcelJS from 'exceljs';

// GET /api/stocktake/export?sessionId=1 - 棚卸し結果のExcelエクスポート
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionIdStr = searchParams.get('sessionId');

    if (!sessionIdStr) {
      return NextResponse.json({ error: 'セッションIDは必須です。' }, { status: 400 });
    }

    const sessionId = parseInt(sessionIdStr, 10);
    const session = await db.stocktakeSession.findUnique({
      where: { id: sessionId },
      include: {
        records: {
          include: {
            product: {
              select: { code: true, name: true, location: true },
            },
          },
          orderBy: { product: { code: 'asc' } },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: '棚卸しセッションが見つかりません。' }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '在庫管理システム';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('棚卸し結果');

    // ヘッダー情報
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `棚卸し表: ${session.title}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1A365D' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 36;

    sheet.mergeCells('A2:G2');
    const infoCell = sheet.getCell('A2');
    const typeLabel = session.type === 'FULL' ? '大規模棚卸し' : '簡易棚卸し';
    const statusLabel = session.status === 'COMPLETED' ? '完了' : '進行中';
    const dateStr = session.createdAt.toLocaleDateString('ja-JP');
    infoCell.value = `種別: ${typeLabel} | 状態: ${statusLabel} | 開始日: ${dateStr}`;
    infoCell.font = { size: 10, color: { argb: 'FF4A5568' } };
    infoCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 24;

    // テーブルヘッダー
    const headerRow = sheet.addRow([
      '商品コード', '商品名', '保管棚', 'システム在庫', '実在庫数', '差異', '担当者',
    ]);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FF2B6CB0' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
    });

    // 列幅の設定
    sheet.getColumn(1).width = 16;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 14;
    sheet.getColumn(5).width = 14;
    sheet.getColumn(6).width = 10;
    sheet.getColumn(7).width = 14;

    // データ行
    let totalDiffCount = 0;
    for (const rec of session.records) {
      const row = sheet.addRow([
        rec.product.code,
        rec.product.name,
        rec.product.location || '-',
        rec.systemStock,
        rec.actualStock,
        rec.difference,
        rec.operator || '-',
      ]);
      row.height = 22;

      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });

      // 差異セルに条件付きスタイル
      const diffCell = row.getCell(6);
      if (rec.difference > 0) {
        diffCell.font = { bold: true, color: { argb: 'FF2F855A' } };
        diffCell.value = `+${rec.difference}`;
      } else if (rec.difference < 0) {
        diffCell.font = { bold: true, color: { argb: 'FFE53E3E' } };
        diffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } };
      }

      if (rec.difference !== 0) totalDiffCount++;
    }

    // 集計サマリー行
    sheet.addRow([]);
    const summaryRow = sheet.addRow([
      '', `合計: ${session.records.length} 品目`, '',
      '', '', `差異あり: ${totalDiffCount} 件`, '',
    ]);
    summaryRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11, color: { argb: 'FF1A365D' } };
    });

    // バッファとして出力
    const buffer = await workbook.xlsx.writeBuffer();

    const filename = `stocktake_${session.title.replace(/[^a-zA-Z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '_')}_${Date.now()}.xlsx`;

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('GET /api/stocktake/export failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
