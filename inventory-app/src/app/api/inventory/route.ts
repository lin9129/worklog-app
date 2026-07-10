import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/inventory - 入出庫履歴の取得 (最新50件)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await db.inventoryLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(logs);
  } catch (error) {
    console.error('GET /api/inventory failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/inventory - 入庫・出庫の登録
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productCode, type, quantity, reason, operator } = body;

    // 必須項目のチェック
    if (!productCode || !type || !quantity) {
      return NextResponse.json(
        { error: '必須項目（商品コード、入出庫種別、数量）が不足しています。' },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: '数量は1以上の整数を指定してください。' }, { status: 400 });
    }

    if (type !== 'IN' && type !== 'OUT') {
      return NextResponse.json({ error: '種別は IN (入庫) または OUT (出庫) を指定してください。' }, { status: 400 });
    }

    // 商品コードから対象商品を検索
    const product = await db.product.findUnique({
      where: { code: productCode },
    });

    if (!product) {
      return NextResponse.json(
        { error: `商品コード「${productCode}」の商品は存在しません。` },
        { status: 404 }
      );
    }

    // 出庫時の在庫不足チェック
    if (type === 'OUT' && product.stock < qty) {
      return NextResponse.json(
        { error: `在庫が不足しています。（現在の在庫: ${product.stock}、出庫要求数: ${qty}）` },
        { status: 400 }
      );
    }

    // トランザクション処理で在庫更新と入出庫ログ作成をアトミックに実行
    const result = await db.$transaction(async (tx) => {
      // 在庫の増減更新
      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          stock: {
            increment: type === 'IN' ? qty : -qty,
          },
        },
      });

      // 履歴ログの作成
      const log = await tx.inventoryLog.create({
        data: {
          productId: product.id,
          type,
          quantity: qty,
          reason: reason || (type === 'IN' ? '仕入れ・入庫' : '出荷・出庫'),
          operator: operator || '倉庫担当者',
        },
        include: {
          product: {
            select: {
              code: true,
              name: true,
              stock: true,
            },
          },
        },
      });

      return log;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/inventory failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
