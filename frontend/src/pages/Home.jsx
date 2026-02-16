import { useState, useEffect, useCallback } from 'react';
import { postApi } from '../services/api';
import { PostCard } from '../components/post';
import { LoadingSpinner, Button } from '../components/common';
import { Flame, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('recent');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadPosts = useCallback(async (pageNum = 1, currentFilter = filter) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await postApi.getFeed(pageNum, 20, currentFilter);
      const { posts: newPosts, pagination } = response.data.data;

      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setPage(pageNum);
      setHasMore(pageNum < pagination.pages);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPosts(1, filter);
  }, [filter]);

  const handleFilterChange = (newFilter) => {
    if (newFilter !== filter) {
      setFilter(newFilter);
    }
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => (p.id || p._id) !== postId));
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev =>
      prev.map(p =>
        (p.id || p._id) === (updatedPost.id || updatedPost._id) ? updatedPost : p
      )
    );
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Filter tabs */}
      <div className="flex justify-center space-x-2 mb-8">
        <button
          onClick={() => handleFilterChange('recent')}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors
            ${filter === 'recent'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          <Clock className="w-4 h-4" />
          <span>Recent</span>
        </button>
        <button
          onClick={() => handleFilterChange('trending')}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors
            ${filter === 'trending'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          <Flame className="w-4 h-4" />
          <span>Trending</span>
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <LoadingSpinner className="py-16" size="lg" />
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No posts yet</p>
          <p className="text-gray-400 mt-2">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <PostCard
              key={post.id || post._id}
              post={post}
              onDelete={handlePostDelete}
              onUpdate={handlePostUpdate}
            />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => loadPosts(page + 1)}
                loading={loadingMore}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
