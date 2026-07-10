import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stocktake/session - 棚卸しセッション履歴、またはアクティブセッションの取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const sessions = await db.stocktakeSession.findMany({
      where: activeOnly ? { status: 'ACTIVE' } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { records: true }
        }
      }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('GET /api/stocktake/session failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/stocktake/session - 新規棚卸しセッションの開始
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type } = body; // type: "SIMPLE" (簡易) / "FULL" (大規模)

    if (!title || !type) {
      return NextResponse.json({ error: 'タイトルと棚卸し種別は必須です。' }, { status: 400 });
    }

    // すでにアクティブなセッションが開始されているか確認 (重複防止)
    const activeSession = await db.stocktakeSession.findFirst({
      where: { status: 'ACTIVE' },
    });
    
    if (activeSession) {
      return NextResponse.json(
        { error: `現在、別の棚卸しセッション「${activeSession.title}」が進行中です。先に完了させてください。` },
        { status: 400 }
      );
    }

    // セッションの作成
    const session = await db.stocktakeSession.create({
      data: {
        title,
        type,
        status: 'ACTIVE',
      },
    });

    // 「大規模棚卸し (FULL)」の場合、その時点での全商品のシステム在庫をロックして明細レコードを事前作成
    if (type === 'FULL') {
      const products = await db.product.findMany();
      if (products.length > 0) {
        await db.stocktakeRecord.createMany({
          data: products.map(p => ({
            sessionId: session.id,
            productId: p.id,
            systemStock: p.stock,
            actualStock: 0,         // スキャンで数えていくため初期値は0
            difference: -p.stock,    // 0 - システム在庫
          })),
        });
      }
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('POST /api/stocktake/session failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
