import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/products/[id] - 特定商品の詳細取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('GET /api/products/[id] failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/products/[id] - 商品の更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 });
    }

    const body = await request.json();
    const { name, code, description, price, minStock, location } = body;

    // 存在チェック
    const product = await db.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 });
    }

    // コードが変更される場合の重複チェック
    if (code && code !== product.code) {
      const existing = await db.product.findUnique({
        where: { code },
      });
      if (existing) {
        return NextResponse.json({ error: `商品コード ${code} はすでに他の商品で登録されています` }, { status: 400 });
      }
    }

    const updated = await db.product.update({
      where: { id: productId },
      data: {
        code: code !== undefined ? code : undefined,
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        minStock: minStock !== undefined ? parseInt(minStock, 10) : undefined,
        location: location !== undefined ? location : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/products/[id] failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - 商品の削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 });
    }

    // 存在チェック
    const product = await db.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: '商品が見つかりません' }, { status: 404 });
    }

    // カスケード削除を設定しているため、リレーションを持つ入出庫ログも自動で削除されます
    await db.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: '商品を削除しました' });
  } catch (error) {
    console.error('DELETE /api/products/[id] failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
