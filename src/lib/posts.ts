import postsData from "../../data/blog/posts.json";
import type { Post, TopicalPillar } from "../types/post";

const allPosts = postsData as Post[];

export function getAllPosts(): Post[] {
  return allPosts
    .filter((p) => !p.draft)
    .sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function getPostsByPillar(pillar: TopicalPillar): Post[] {
  return getAllPosts().filter((p) => p.topicalPillar === pillar);
}

export function getRelatedPosts(slug: string, limit = 3): Post[] {
  const target = getPostBySlug(slug);
  if (!target) return [];
  return getAllPosts()
    .filter(
      (p) => p.slug !== slug && p.topicalPillar === target.topicalPillar
    )
    .slice(0, limit);
}

export function getAllSlugs(): string[] {
  return allPosts.map((p) => p.slug);
}
