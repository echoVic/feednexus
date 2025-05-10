"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { FolderIcon, HomeIcon, StarIcon, PlusIcon, LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
// 自定义类型定义

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

interface SidebarProps {
  subscriptions: SubscriptionWithFeed[];
  onAddFeed: (url: string, folder: string) => Promise<void>;
}

export function Sidebar({ subscriptions, onAddFeed }: SidebarProps) {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [folder, setFolder] = useState("未分类");
  const [isLoading, setIsLoading] = useState(false);

  // 按文件夹分组订阅
  const groupedSubscriptions = subscriptions.reduce((acc, sub) => {
    if (!acc[sub.folder]) {
      acc[sub.folder] = [];
    }
    acc[sub.folder].push(sub);
    return acc;
  }, {} as Record<string, SubscriptionWithFeed[]>);

  // 获取所有文件夹
  const folders = Object.keys(groupedSubscriptions).sort();

  const handleAddFeed = async () => {
    if (!url) {
      toast.error("请输入 RSS 链接");
      return;
    }

    setIsLoading(true);
    try {
      await onAddFeed(url, folder);
      setUrl("");
      setFolder("未分类");
      setIsAddDialogOpen(false);
      toast.success("添加订阅成功");
    } catch (error) {
      console.error("添加订阅失败:", error);
      toast.error("添加订阅失败，请检查链接是否有效");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    toast.success("已退出登录");
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">RSS 阅读器</h1>
      </div>

      <div className="flex flex-col gap-1 p-2">
        <Button variant="ghost" className="justify-start" onClick={() => router.push("/dashboard")}>
          <HomeIcon className="mr-2 h-4 w-4" />
          首页
        </Button>
        <Button variant="ghost" className="justify-start" onClick={() => router.push("/dashboard?filter=starred")}>
          <StarIcon className="mr-2 h-4 w-4" />
          已收藏
        </Button>
      </div>

      <div className="flex items-center justify-between p-4">
        <h2 className="text-sm font-semibold">我的订阅</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加 RSS 订阅</DialogTitle>
              <DialogDescription>
                输入 RSS 链接和文件夹名称，添加新的订阅源
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="url" className="text-sm font-medium">
                  RSS 链接
                </label>
                <Input
                  id="url"
                  placeholder="https://example.com/feed.xml 或 RSSHub 路径"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="folder" className="text-sm font-medium">
                  文件夹
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
              <Button onClick={handleAddFeed} disabled={isLoading}>
                {isLoading ? "添加中..." : "添加"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {folders.map((folder) => (
            <div key={folder} className="mb-4">
              <div className="flex items-center mb-1">
                <FolderIcon className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">{folder}</span>
              </div>
              <div className="ml-6 space-y-1">
                {groupedSubscriptions[folder].map((sub) => (
                  <Button
                    key={sub.id}
                    variant="ghost"
                    className="w-full justify-start truncate"
                    onClick={() => router.push(`/dashboard/feed/${sub.feedId}`)}
                  >
                    <span className="truncate">{sub.feed.title}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          退出登录
        </Button>
      </div>
    </div>
  );
}
