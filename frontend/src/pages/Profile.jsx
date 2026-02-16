import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, LoadingSpinner, Button } from '../components/common';
import { PostCard } from '../components/post';
import { Grid, Settings, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, postsRes] = await Promise.all([
        userApi.getProfile(username),
        userApi.getUserPosts(username, 1, 12)
      ]);

      setProfile(profileRes.data.data.user);
      setIsOwner(profileRes.data.data.isOwner);
      setPosts(postsRes.data.data.posts);
      setPage(1);
      setHasMore(postsRes.data.data.pagination.pages > 1);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await userApi.getUserPosts(username, page + 1, 12);
      setPosts(prev => [...prev, ...response.data.data.posts]);
      setPage(prev => prev + 1);
      setHasMore(response.data.data.pagination.page < response.data.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load more posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => (p.id || p._id) !== postId));
    if (profile) {
      setProfile(prev => ({ ...prev, postCount: Math.max(0, prev.postCount - 1) }));
    }
  };

  if (loading) {
    return <LoadingSpinner className="py-16" size="lg" />;
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
        <p className="text-gray-500 mt-2">The user you're looking for doesn't exist.</p>
        <Link to="/" className="text-primary-600 mt-4 inline-block hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <Avatar src={profile.profileImage} alt={profile.username} size="xl" />

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
              {isOwner && (
                <Link to="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start space-x-8 mb-4">
              <div className="text-center">
                <span className="font-bold text-gray-900">{profile.postCount}</span>
                <span className="text-gray-500 ml-1">posts</span>
              </div>
              {profile.totalLikesReceived !== undefined && (
                <div className="text-center flex items-center">
                  <Heart className="w-4 h-4 text-red-500 mr-1" />
                  <span className="font-bold text-gray-900">{profile.totalLikesReceived}</span>
                  <span className="text-gray-500 ml-1">likes</span>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg">No posts yet</p>
          {isOwner && (
            <Link to="/create" className="text-primary-600 mt-2 inline-block hover:underline">
              Create your first post
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {posts.map(post => (
            <Link
              key={post.id || post._id}
              to={`/post/${post.id || post._id}`}
              className="aspect-square bg-gray-100 relative group overflow-hidden rounded-md"
            >
              <img
                src={post.image}
                alt={post.caption || 'Post'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center space-x-4 text-white">
                  <span className="flex items-center">
                    <Heart className="w-5 h-5 mr-1 fill-current" />
                    {post.likeCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-6 max-w-xl mx-auto">
          {posts.map(post => (
            <PostCard
              key={post.id || post._id}
              post={post}
              onDelete={handlePostDelete}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={loadMorePosts}
            loading={loadingPosts}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
