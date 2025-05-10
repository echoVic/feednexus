import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 获取特定订阅源的详情
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 在 Next.js 15 中，params 是一个 Promise，需要使用 await 解包
    const resolvedParams = await params;
    
    // 确保 params 存在且有效
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json(
        { error: "无效的订阅源ID" },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    // 安全地访问 id 参数
    const feedId = resolvedParams.id;

    // 检查用户是否已订阅该 Feed
    const subscription = await prisma.subscription.findFirst({
      where: {
        feedId: feedId,
        userId: session.user.id,
      },
      include: {
        feed: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "未找到订阅" },
        { status: 404 }
      );
    }

    // 获取该 Feed 的最新文章
    const items = await prisma.feedItem.findMany({
      where: {
        feedId: feedId,
      },
      orderBy: {
        publishedAt: "desc",
      },
      include: {
        readStatus: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    return NextResponse.json({
      subscription,
      items,
    });
  } catch (error) {
    console.error("获取订阅详情失败:", error);
    return NextResponse.json(
      { error: "获取订阅详情失败" },
      { status: 500 }
    );
  }
}

// 更新订阅信息（文件夹、排序等）
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 在 Next.js 15 中，params 是一个 Promise，需要使用 await 解包
    const resolvedParams = await params;
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    // 安全地访问 id 参数
    const feedId = resolvedParams.id;
    const { folder, sortOrder } = await req.json();

    // 检查用户是否已订阅该 Feed
    const subscription = await prisma.subscription.findFirst({
      where: {
        feedId: feedId,
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "未找到订阅" },
        { status: 404 }
      );
    }

    // 更新订阅信息
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        folder: folder !== undefined ? folder : subscription.folder,
        sortOrder: sortOrder !== undefined ? sortOrder : subscription.sortOrder,
      },
      include: {
        feed: true,
      },
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error("更新订阅失败:", error);
    return NextResponse.json(
      { error: "更新订阅失败" },
      { status: 500 }
    );
  }
}

// 取消订阅
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 在 Next.js 15 中，params 是一个 Promise，需要使用 await 解包
    const resolvedParams = await params;
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    // 安全地访问 id 参数
    const feedId = resolvedParams.id;

    // 检查用户是否已订阅该 Feed
    const subscription = await prisma.subscription.findFirst({
      where: {
        feedId: feedId,
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "未找到订阅" },
        { status: 404 }
      );
    }

    // 删除订阅
    await prisma.subscription.delete({
      where: {
        id: subscription.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("取消订阅失败:", error);
    return NextResponse.json(
      { error: "取消订阅失败" },
      { status: 500 }
    );
  }
}
