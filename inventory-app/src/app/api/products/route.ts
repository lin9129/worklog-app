import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/products - 商品一覧の取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const alert = searchParams.get('alert') === 'true'; // 在庫ゼロ・少量アラートフィルタ

    // 検索条件の設定 (部分一致検索)
    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { code: { contains: query } },
          { location: { contains: query } },
        ],
      },
      orderBy: { id: 'asc' },
    });

    // SQLiteの制限によりPrisma where句内で動的な列間比較（stock <= minStock）ができないため、
    // 取得後にJS側でアラートフィルタリングを行う
    let filteredProducts = products;
    if (alert) {
      filteredProducts = products.filter(p => p.stock <= p.minStock);
    }

    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('GET /api/products failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/products - 商品の新規作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, minStock, location } = body;

    if (!name) {
      return NextResponse.json({ error: '商品名は必須項目です' }, { status: 400 });
    }

    // 自動採番処理
    let { code } = body;
    if (!code) {
      const lastProduct = await db.product.findFirst({
        orderBy: { id: 'desc' },
      });
      let nextNum = 1;
      if (lastProduct && lastProduct.code.startsWith('INV')) {
        const lastNumStr = lastProduct.code.replace('INV', '');
        const lastNum = parseInt(lastNumStr, 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      code = `INV${String(nextNum).padStart(5, '0')}`;
    }

    // 重複チェック
    const existing = await db.product.findUnique({
      where: { code },
    });
    if (existing) {
      return NextResponse.json({ error: `商品コード ${code} はすでに登録されています` }, { status: 400 });
    }

    // 新規登録 (初期在庫は0)
    const newProduct = await db.product.create({
      data: {
        code,
        name,
        description: description || '',
        price: price ? parseFloat(price) : 0,
        minStock: minStock !== undefined ? parseInt(minStock, 10) : 5,
        location: location || '',
        stock: 0,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('POST /api/products failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
