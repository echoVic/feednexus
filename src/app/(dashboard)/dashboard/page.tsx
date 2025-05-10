"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Sidebar } from "@/components/dashboard/sidebar";
import { ArticleList } from "@/components/dashboard/article-list";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "unread";

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  // 获取订阅列表
  const fetchSubscriptions = async () => {
    setIsLoadingSubscriptions(true);
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
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  // 获取文章列表
  const fetchArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const response = await fetch(`/api/items?filter=${filter}`);
      if (!response.ok) {
        throw new Error("获取文章失败");
      }
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error("获取文章失败:", error);
      toast.error("获取文章失败，请刷新页面重试");
    } finally {
      setIsLoadingArticles(false);
    }
  };

  // 添加新订阅
  const handleAddFeed = async (url: string, folder: string) => {
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

      // 刷新订阅列表和文章列表
      await fetchSubscriptions();
      await fetchArticles();
    } catch (error: any) {
      console.error("添加订阅失败:", error);
      throw new Error(error.message || "添加订阅失败");
    }
  };

  // 标记文章为已读
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
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
          article.id === id ? { ...article, isRead: true } : article
        )
      );
    } catch (error) {
      console.error("标记已读失败:", error);
      toast.error("标记已读失败");
    }
  };

  // 切换文章星标状态
  const handleToggleStar = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
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
          article.id === id ? { ...article, isStarred: data.isStarred } : article
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
  }, []);

  // 当过滤器变化时重新加载文章
  useEffect(() => {
    fetchArticles();
  }, [filter]);

  return (
    <div className="flex h-screen">
      <Sidebar
        subscriptions={subscriptions}
        onAddFeed={handleAddFeed}
      />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {filter === "starred" ? "已收藏文章" : "未读文章"}
          </h1>
          <p className="text-muted-foreground">
            {filter === "starred"
              ? "您收藏的所有文章"
              : "所有未读的最新文章"}
          </p>
        </div>
        <ArticleList
          articles={articles}
          isLoading={isLoadingArticles}
          onMarkAsRead={handleMarkAsRead}
          onToggleStar={handleToggleStar}
        />
      </main>
    </div>
  );
}
