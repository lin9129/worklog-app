import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stocktake/session/[id] - 特定棚卸しセッションの詳細と明細レコードの取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id, 10);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: '無効なセッションIDです。' }, { status: 400 });
    }

    const session = await db.stocktakeSession.findUnique({
      where: { id: sessionId },
      include: {
        records: {
          include: {
            product: {
              select: {
                code: true,
                name: true,
                location: true,
              },
            },
          },
          orderBy: { scannedAt: 'desc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: '棚卸しセッションが見つかりません。' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('GET /api/stocktake/session/[id] failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/stocktake/session/[id] - 棚卸しセッションの完了 (在庫数自動調整)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id, 10);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: '無効なセッションIDです。' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (status !== 'COMPLETED') {
      return NextResponse.json({ error: 'サポートされていないステータス更新です。' }, { status: 400 });
    }

    const session = await db.stocktakeSession.findUnique({
      where: { id: sessionId },
      include: { records: true },
    });

    if (!session) {
      return NextResponse.json({ error: '棚卸しセッションが見つかりません。' }, { status: 404 });
    }

    if (session.status === 'COMPLETED') {
      return NextResponse.json({ error: 'このセッションはすでに完了しています。' }, { status: 400 });
    }

    // トランザクション処理で在庫調整とセッション完了をアトミックに実行
    await db.$transaction(async (tx) => {
      // 1. 各明細レコードの差異に基づき、商品の在庫数を実在庫数に上書きし、調整ログを作成
      for (const rec of session.records) {
        if (rec.difference !== 0) {
          // 商品マスタの在庫数を実在庫に調整
          await tx.product.update({
            where: { id: rec.productId },
            data: { stock: rec.actualStock },
          });

          // 調整ログを作成 (ADJUST タイプ)
          await tx.inventoryLog.create({
            data: {
              productId: rec.productId,
              type: 'ADJUST',
              quantity: Math.abs(rec.difference),
              reason: `棚卸し調整 (差異: ${rec.difference > 0 ? '+' : ''}${rec.difference}) [セッション: ${session.title}]`,
              operator: rec.operator || 'システム自動調整',
            },
          });
        }
      }

      // 2. セッションステータスを完了にする
      await tx.stocktakeSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ message: '棚卸しが完了し、在庫調整が正常に実行されました。' });
  } catch (error) {
    console.error('PUT /api/stocktake/session/[id] failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/stocktake/session/[id] - 棚卸しセッションのキャンセル (削除)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id, 10);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: '無効なセッションIDです。' }, { status: 400 });
    }

    const session = await db.stocktakeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: '棚卸しセッションが見つかりません。' }, { status: 404 });
    }

    if (session.status === 'COMPLETED') {
      return NextResponse.json({ error: '完了済みの棚卸しセッションは削除できません。' }, { status: 400 });
    }

    // カスケード削除されるため、明細レコード (StocktakeRecord) も自動削除されます
    await db.stocktakeSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ message: '棚卸しセッションを破棄しました。' });
  } catch (error) {
    console.error('DELETE /api/stocktake/session/[id] failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
