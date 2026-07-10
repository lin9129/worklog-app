import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/stocktake/scan - バーコードスキャンによる棚卸し実績の登録・更新
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, productCode, actualStock, increment } = body;

    if (!sessionId || !productCode) {
      return NextResponse.json({ error: 'セッションIDおよび商品コードは必須項目です。' }, { status: 400 });
    }

    const sessId = parseInt(sessionId, 10);

    // セッションのアクティブ状態を確認
    const session = await db.stocktakeSession.findUnique({
      where: { id: sessId },
    });

    if (!session || session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '指定された棚卸しセッションが存在しないか、すでに完了・キャンセルされています。' },
        { status: 400 }
      );
    }

    // 商品を取得
    const product = await db.product.findUnique({
      where: { code: productCode },
    });

    if (!product) {
      return NextResponse.json(
        { error: `商品コード「${productCode}」の商品は登録されていません。` },
        { status: 404 }
      );
    }

    // 既に該当セッションに商品の棚卸しレコードがあるか検索
    const existingRecord = await db.stocktakeRecord.findUnique({
      where: {
        sessionId_productId: {
          sessionId: sessId,
          productId: product.id,
        },
      },
    });

    let record;
    if (existingRecord) {
      // 既にレコードがある場合は更新
      let newActual = existingRecord.actualStock;
      if (increment) {
        newActual += 1;
      } else {
        newActual = parseInt(actualStock, 10);
      }

      if (isNaN(newActual) || newActual < 0) {
        return NextResponse.json({ error: '実在庫数は0以上の整数で指定してください。' }, { status: 400 });
      }

      record = await db.stocktakeRecord.update({
        where: { id: existingRecord.id },
        data: {
          actualStock: newActual,
          difference: newActual - existingRecord.systemStock,
        },
        include: {
          product: {
            select: {
              code: true,
              name: true,
              location: true,
            },
          },
        },
      });
    } else {
      // レコードがない場合は新規作成 (簡易棚卸しや、大規模での追加商品など)
      let newActual = 0;
      if (increment) {
        newActual = 1;
      } else {
        newActual = parseInt(actualStock, 10);
      }

      if (isNaN(newActual) || newActual < 0) {
        return NextResponse.json({ error: '実在庫数は0以上の整数で指定してください。' }, { status: 400 });
      }

      record = await db.stocktakeRecord.create({
        data: {
          sessionId: sessId,
          productId: product.id,
          systemStock: product.stock,
          actualStock: newActual,
          difference: newActual - product.stock,
        },
        include: {
          product: {
            select: {
              code: true,
              name: true,
              location: true,
            },
          },
        },
      });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('POST /api/stocktake/scan failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
