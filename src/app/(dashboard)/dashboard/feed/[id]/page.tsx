"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftIcon, TrashIcon, FolderIcon } from "lucide-react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { ArticleList } from "@/components/dashboard/article-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// 定义类型
interface SubscriptionWithFeed {
  id: string;
  userId: string;
  feedId: string;
  folder: string;
  sortOrder: number;
  feed: {
    id: string;
    title: string;
    url: string;
    description?: string | null;
    siteUrl?: string | null;
    imageUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface FeedItem {
  id: string;
  title: string;
  link: string;
  description?: string | null;
  content?: string | null;
  author?: string | null;
  publishedAt: string;
  feed: {
    id: string;
    title: string;
  };
  isRead: boolean;
  isStarred: boolean;
  readStatus: Array<{
    isRead: boolean;
    isStarred: boolean;
  }>;
}

interface FeedPageProps {
  params: {
    id: string;
  };
}

export default function FeedPage({ params }: FeedPageProps) {
  const router = useRouter();
  // 使用 React.use() 解包 params
  // 在 Next.js 15 中，params 是一个 Promise，需要使用 use 函数解包
  const resolvedParams = use(params as unknown as Promise<{id: string}>);
  const id = resolvedParams.id;

  const [subscriptions, setSubscriptions] = useState<SubscriptionWithFeed[]>([]);
  const [feedDetails, setFeedDetails] = useState<SubscriptionWithFeed | null>(null);
  const [articles, setArticles] = useState<FeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [folder, setFolder] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // 获取订阅列表
  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await fetch("/api/feeds");
      if (!response.ok) {
        throw new Error("获取订阅失败");
      }
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error("获取订阅失败:", error);
      toast.error("获取订阅失败，请刷新页面重试");
    }
  }, []);

  // 获取订阅源详情
  const fetchFeedDetails = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      const response = await fetch(`/api/feeds/${id}`);
      if (!response.ok) {
        throw new Error("获取订阅详情失败");
      }
      const data = await response.json();
      setFeedDetails(data.subscription);
      setArticles(data.items.map((item: {
        id: string;
        title: string;
        link: string;
        description?: string | null;
        content?: string | null;
        author?: string | null;
        publishedAt: string;
        feed: {
          id: string;
          title: string;
        };
        readStatus: Array<{
          isRead: boolean;
          isStarred: boolean;
        }>;
      }) => ({
        ...item,
        isRead: item.readStatus.length > 0 ? item.readStatus[0].isRead : false,
        isStarred: item.readStatus.length > 0 ? item.readStatus[0].isStarred : false,
      })));
      setFolder(data.subscription.folder);
    } catch (error) {
      console.error("获取订阅详情失败:", error);
      toast.error("获取订阅详情失败，请刷新页面重试");
      router.push("/dashboard");
    } finally {
      setIsLoadingFeed(false);
    }
  }, [id, router]);

  // 添加新订阅
  const handleAddFeed = useCallback(async (url: string, folder: string) => {
    try {
      const response = await fetch("/api/feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, folder }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "添加订阅失败");
      }

      // 刷新订阅列表
      await fetchSubscriptions();
    } catch (error) {
      console.error("添加订阅失败:", error);
      throw new Error(
        error instanceof Error ? error.message : "添加订阅失败"
      );
    }
  }, [fetchSubscriptions]);

  // 更新订阅文件夹
  const handleUpdateFolder = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/feeds/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folder }),
      });

      if (!response.ok) {
        throw new Error("更新文件夹失败");
      }

      toast.success("更新文件夹成功");
      setIsEditDialogOpen(false);
      await fetchSubscriptions();
      await fetchFeedDetails();
    } catch (error) {
      console.error("更新文件夹失败:", error);
      toast.error("更新文件夹失败");
    } finally {
      setIsUpdating(false);
    }
  };

  // 取消订阅
  const handleUnsubscribe = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/feeds/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("取消订阅失败");
      }

      toast.success("已取消订阅");
      router.push("/dashboard");
    } catch (error) {
      console.error("取消订阅失败:", error);
      toast.error("取消订阅失败");
    } finally {
      setIsUpdating(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // 标记文章为已读
  const handleMarkAsRead = async (articleId: string) => {
    try {
      const response = await fetch(`/api/items/${articleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "read" }),
      });

      if (!response.ok) {
        throw new Error("标记已读失败");
      }

      // 更新本地状态
      setArticles((prevArticles) =>
        prevArticles.map((article) =>
          article.id === articleId ? { ...article, isRead: true } : article
        )
      );
    } catch (error) {
      console.error("标记已读失败:", error);
      toast.error("标记已读失败");
    }
  };

  // 切换文章星标状态
  const handleToggleStar = async (articleId: string) => {
    try {
      const response = await fetch(`/api/items/${articleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "star" }),
      });

      if (!response.ok) {
        throw new Error("切换星标失败");
      }

      const data = await response.json();

      // 更新本地状态
      setArticles((prevArticles) =>
        prevArticles.map((article) =>
          article.id === articleId ? { ...article, isStarred: data.isStarred } : article
        )
      );
    } catch (error) {
      console.error("切换星标失败:", error);
      toast.error("切换星标失败");
    }
  };

  // 初始加载
  useEffect(() => {
    fetchSubscriptions();
    fetchFeedDetails();
  }, [fetchSubscriptions, fetchFeedDetails]);

  return (
    <div className="flex h-screen">
      <Sidebar
        subscriptions={subscriptions}
        onAddFeed={handleAddFeed}
      />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {feedDetails?.feed.title || "加载中..."}
            </h1>
          </div>
          
          {feedDetails && (
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center">
                <FolderIcon className="h-4 w-4 mr-1" />
                <span>{feedDetails.folder}</span>
              </div>
              <div className="flex gap-2">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      编辑文件夹
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>编辑文件夹</DialogTitle>
                      <DialogDescription>
                        更改此订阅源的文件夹分类
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="folder" className="text-sm font-medium">
                          文件夹名称
                        </label>
                        <Input
                          id="folder"
                          placeholder="未分类"
                          value={folder}
                          onChange={(e) => setFolder(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleUpdateFolder} disabled={isUpdating}>
                        {isUpdating ? "更新中..." : "更新"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <TrashIcon className="h-4 w-4 mr-1" />
                      取消订阅
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>确认取消订阅</DialogTitle>
                      <DialogDescription>
                        您确定要取消订阅 &quot;{feedDetails.feed.title}&quot; 吗？此操作无法撤销。
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        取消
                      </Button>
                      <Button variant="destructive" onClick={handleUnsubscribe} disabled={isUpdating}>
                        {isUpdating ? "处理中..." : "确认取消订阅"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>

        <ArticleList
          articles={articles}
          isLoading={isLoadingFeed}
          onMarkAsRead={handleMarkAsRead}
          onToggleStar={handleToggleStar}
        />
      </main>
    </div>
  );
}
