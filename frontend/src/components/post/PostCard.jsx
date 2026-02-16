import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { postApi } from '../../services/api';
import { Avatar, Modal, Button, Textarea } from '../common';
import toast from 'react-hot-toast';

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [liked, setLiked] = useState(post.hasLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || '');
  const [loading, setLoading] = useState(false);

  const isOwner = user && post.author && (post.isOwner || user.id === post.author.id || user.id === post.author._id);
  const canDelete = isOwner || isAdmin;
  const canEdit = isOwner;

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (liked) {
        await postApi.unlikePost(post.id || post._id);
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await postApi.likePost(post.id || post._id);
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update like');
    }
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      const response = await postApi.updatePost(post.id || post._id, editCaption);
      toast.success('Post updated');
      setShowEditModal(false);
      if (onUpdate) {
        onUpdate({ ...post, caption: editCaption });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await postApi.deletePost(post.id || post._id);
      toast.success('Post deleted');
      setShowDeleteModal(false);
      if (onDelete) {
        onDelete(post.id || post._id);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link
          to={`/user/${post.author?.username}`}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
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

      {/* Image */}
      <Link to={`/post/${post.id || post._id}`}>
        <img
          src={post.image}
          alt={post.caption || 'Post image'}
          className="w-full aspect-square object-cover"
        />
      </Link>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-3">
          <button
            onClick={handleLike}
            className={`transition-colors ${liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
          </button>
          <Link
            to={`/post/${post.id || post._id}`}
            className="text-gray-600 hover:text-primary-600 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </Link>
        </div>

        {/* Like count */}
        <p className="font-semibold text-gray-900 mb-2">
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="text-gray-800">
            <Link to={`/user/${post.author?.username}`} className="font-medium hover:underline">
              {post.author?.username}
            </Link>{' '}
            {post.caption}
          </p>
        )}

        {/* Comments link */}
        {post.commentCount > 0 && (
          <Link
            to={`/post/${post.id || post._id}`}
            className="text-gray-500 text-sm mt-2 block hover:text-gray-700"
          >
            View all {post.commentCount} comments
          </Link>
        )}

        {/* Timestamp */}
        <p className="text-gray-400 text-xs mt-2">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>
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
          <Button onClick={handleEdit} loading={loading}>
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
          <Button variant="danger" onClick={handleDelete} loading={loading}>
            Delete
          </Button>
        </div>
      </Modal>
    </article>
  );
}
