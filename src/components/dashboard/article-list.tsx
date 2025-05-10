"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { StarIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface ArticleListProps {
  articles: any[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onToggleStar: (id: string) => Promise<void>;
}

export function ArticleList({ articles, isLoading, onMarkAsRead, onToggleStar }: ArticleListProps) {
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleArticleClick = (article: any) => {
    setSelectedArticle(article);
    setIsSheetOpen(true);
    if (!article.isRead) {
      onMarkAsRead(article.id);
    }
  };

  const handleToggleStar = (e: React.MouseEvent, article: any) => {
    e.stopPropagation();
    onToggleStar(article.id);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="cursor-pointer hover:bg-muted/50">
            <CardHeader className="p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/4" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h3 className="text-xl font-medium mb-2">没有文章</h3>
        <p className="text-muted-foreground text-center">
          您当前没有未读文章，请添加更多订阅或刷新现有订阅。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {articles.map((article) => (
          <Card
            key={article.id}
            className={`cursor-pointer hover:bg-muted/50 ${
              article.isRead ? "opacity-60" : ""
            }`}
            onClick={() => handleArticleClick(article)}
          >
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">{article.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => handleToggleStar(e, article)}
                >
                  <StarIcon
                    className={`h-4 w-4 ${article.isStarred ? "fill-yellow-400 text-yellow-400" : ""}`}
                  />
                </Button>
              </div>
              <CardDescription>
                {article.feed?.title || "未知来源"} · {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: zhCN })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.description?.replace(/<[^>]*>/g, "") || "无描述"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
          {selectedArticle && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-xl">{selectedArticle.title}</SheetTitle>
                <SheetDescription>
                  <div className="flex justify-between items-center">
                    <span>
                      {selectedArticle.feed.title} · {formatDistanceToNow(new Date(selectedArticle.publishedAt), { addSuffix: true, locale: zhCN })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onToggleStar(selectedArticle.id)}
                      >
                        <StarIcon
                          className={`h-4 w-4 ${selectedArticle.isStarred ? "fill-yellow-400 text-yellow-400" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onMarkAsRead(selectedArticle.id)}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </SheetDescription>
              </SheetHeader>
              <div className="article-content prose prose-sm max-w-none">
                {selectedArticle.content ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                ) : selectedArticle.description ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedArticle.description }} />
                ) : (
                  <p>无内容</p>
                )}
              </div>
              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(selectedArticle.link, "_blank")}
                >
                  在新窗口打开原文
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
