import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Edit, Trash2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { postApi, commentApi } from '../../services/api';
import { Avatar, Button, Textarea, LoadingSpinner } from '../common';
import toast from 'react-hot-toast';

export default function CommentSection({ postId }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await postApi.getComments(postId, pageNum);
      const { comments: newComments, pagination } = response.data.data;

      if (pageNum === 1) {
        setComments(newComments);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }

      setPage(pageNum);
      setHasMore(pageNum < pagination.pages);
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await commentApi.createComment(postId, newComment.trim());
      setComments(prev => [response.data.data.comment, ...prev]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const response = await commentApi.updateComment(commentId, editContent.trim());
      setComments(prev =>
        prev.map(c =>
          (c.id || c._id) === commentId
            ? { ...c, content: editContent.trim(), isEdited: true }
            : c
        )
      );
      setEditingId(null);
      toast.success('Comment updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => (c.id || c._id) !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete comment');
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id || comment._id);
    setEditContent(comment.content);
    setMenuOpenId(null);
  };

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="flex items-start space-x-3">
          <Avatar src={user?.profileImage} alt={user?.username} size="sm" />
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={1000}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button
              type="submit"
              disabled={!newComment.trim()}
              loading={submitting}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Comments list */}
      {loading && comments.length === 0 ? (
        <LoadingSpinner className="py-8" />
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const commentId = comment.id || comment._id;
            const isOwner = user && (comment.isOwner || user.id === comment.author?.id || user.id === comment.author?._id);
            const canModify = isOwner || isAdmin;

            return (
              <div key={commentId} className="flex space-x-3 animate-fade-in">
                <Link to={`/user/${comment.author?.username}`}>
                  <Avatar src={comment.author?.profileImage} alt={comment.author?.username} size="sm" />
                </Link>

                <div className="flex-1">
                  {editingId === commentId ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        maxLength={1000}
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleEdit(commentId)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            to={`/user/${comment.author?.username}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {comment.author?.username}
                          </Link>
                          <span className="text-gray-700 ml-2">{comment.content}</span>
                        </div>

                        {canModify && (
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpenId(menuOpenId === commentId ? null : commentId)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {menuOpenId === commentId && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setMenuOpenId(null)}
                                />
                                <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border z-20 py-1 min-w-[100px]">
                                  {isOwner && (
                                    <button
                                      onClick={() => startEdit(comment)}
                                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      handleDelete(commentId);
                                    }}
                                    className="w-full flex items-center space-x-2 px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                        <span>
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        {comment.isEdited && <span>(edited)</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadComments(page + 1)}
                loading={loading}
              >
                Load more comments
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
