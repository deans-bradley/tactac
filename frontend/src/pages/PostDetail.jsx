import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, ArrowLeft, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { postApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CommentSection } from '../components/post';
import { Avatar, LoadingSpinner, Button, Modal, Textarea } from '../components/common';
import toast from 'react-hot-toast';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await postApi.getPost(postId);
      const postData = response.data.data.post;
      setPost(postData);
      setLiked(postData.hasLiked);
      setLikeCount(postData.likeCount);
      setEditCaption(postData.caption || '');
    } catch (error) {
      toast.error('Failed to load post');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (liked) {
        await postApi.unlikePost(postId);
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await postApi.likePost(postId);
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update like');
    }
  };

  const handleEdit = async () => {
    setActionLoading(true);
    try {
      await postApi.updatePost(postId, editCaption);
      setPost(prev => ({ ...prev, caption: editCaption }));
      setShowEditModal(false);
      toast.success('Post updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update post');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await postApi.deletePost(postId);
      toast.success('Post deleted');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to delete post');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="py-16" size="lg" />;
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Post not found</h1>
        <Link to="/" className="text-primary-600 mt-4 inline-block hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  const isOwner = user && (post.isOwner || user.id === post.author?.id || user.id === post.author?._id);
  const canDelete = isOwner || isAdmin;
  const canEdit = isOwner;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Image */}
          <div className="md:w-1/2">
            <img
              src={post.image}
              alt={post.caption || 'Post image'}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="md:w-1/2 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Link
                to={`/user/${post.author?.username}`}
                className="flex items-center space-x-3"
              >
                <Avatar src={post.author?.profileImage} alt={post.author?.username} size="md" />
                <span className="font-medium text-gray-900">{post.author?.username}</span>
              </Link>

              {(canEdit || canDelete) && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border z-20 py-1 min-w-[120px]">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              setShowEditModal(true);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              setShowDeleteModal(true);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-gray-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Caption & Comments */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[400px]">
              {/* Caption */}
              {post.caption && (
                <div className="flex space-x-3 mb-4 pb-4 border-b">
                  <Link to={`/user/${post.author?.username}`}>
                    <Avatar src={post.author?.profileImage} alt={post.author?.username} size="sm" />
                  </Link>
                  <div>
                    <Link
                      to={`/user/${post.author?.username}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {post.author?.username}
                    </Link>
                    <p className="text-gray-700 mt-1">{post.caption}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}

              {/* Comments */}
              <CommentSection postId={postId} />
            </div>

            {/* Actions */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-4 mb-2">
                <button
                  onClick={handleLike}
                  className={`transition-colors ${liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
                >
                  <Heart className={`w-7 h-7 ${liked ? 'fill-current' : ''}`} />
                </button>
              </div>
              <p className="font-semibold text-gray-900">
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Post"
      >
        <Textarea
          value={editCaption}
          onChange={(e) => setEditCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={3}
          maxLength={500}
        />
        <div className="flex justify-end space-x-3 mt-4">
          <Button variant="ghost" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleEdit} loading={actionLoading}>
            Save
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Post"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this post? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={actionLoading}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
