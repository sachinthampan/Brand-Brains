
import React, { useState } from 'react';
import { PostContent, PostStatus, MediaType, SocialPlatform, SocialConnection } from '../types';
import { generatePostImage, generatePostVideo } from '../services/geminiService';
import { postToX } from '../services/xService';

interface PostCardProps {
  post: PostContent;
  onUpdate: (updated: PostContent) => void;
  onDelete: (id: string) => void;
  connections: SocialConnection[];
  onLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, onDelete, connections, onLog }) => {
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);

  const xConnection = connections.find(c => c.platform === SocialPlatform.X && c.isConnected);

  const handleGenerateMedia = async () => {
    setLoadingMedia(true);
    onLog(`AI generating visual for topic: "${post.topic}" using Gemini...`, "info");
    try {
      let url = '';
      if (post.mediaType === MediaType.IMAGE) {
        url = await generatePostImage(post.topic);
        onLog(`Visual image generated successfully.`, "success");
      } else if (post.mediaType === MediaType.VIDEO) {
        onLog(`Veo video generator initiated. This may take up to 30 seconds...`, "info");
        url = await generatePostVideo(post.topic);
        onLog(`Short-form video generated successfully.`, "success");
      }
      onUpdate({ ...post, mediaUrl: url });
    } catch (error) {
      onLog(`Media generation failed. Ensure your API key is valid and has required permissions.`, "error");
      alert("Failed to generate media. Please check your network and API configuration.");
    } finally {
      setLoadingMedia(false);
    }
  };

  const handlePublishToX = async () => {
    if (!xConnection?.credentials) {
      onLog(`Publish failed: X account credentials missing.`, "error");
      alert("Please connect your X account with credentials first.");
      return;
    }

    onLog(`Initiating direct publish to X.com for post: "${post.topic}"...`, "info");
    setIsPublishing(true);
    try {
      const result = await postToX(xConnection.credentials, post);
      if (result.success) {
        onLog(`SUCCESS: Post successfully published to ${xConnection.handle} timeline.`, "success");
        onUpdate({ ...post, status: PostStatus.POSTED });
      } else {
        onLog(`X.com publication error: ${result.message}`, "error");
        alert(result.message);
      }
    } catch (error) {
      onLog(`Unknown error during X.com publication.`, "error");
      alert("An error occurred while publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStatusChange = (status: PostStatus) => {
    onUpdate({ ...post, status });
    onLog(`Post status updated to: ${status}`, "info");
  };

  const handleSaveCaption = () => {
    onUpdate({ ...post, caption: editCaption });
    setIsEditing(false);
    onLog(`Draft caption updated.`, "info");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md flex flex-col h-full">
      <div className="relative aspect-[4/5] bg-slate-100 flex items-center justify-center overflow-hidden">
        {post.mediaUrl ? (
          post.mediaType === MediaType.VIDEO ? (
            <video src={post.mediaUrl} className="w-full h-full object-cover" controls />
          ) : (
            <img src={post.mediaUrl} alt={post.topic} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="text-center p-6">
            <i className={`fas ${post.mediaType === MediaType.VIDEO ? 'fa-video' : 'fa-image'} text-4xl text-slate-300 mb-4`}></i>
            <p className="text-sm text-slate-500 mb-4 font-medium">No visual generated yet</p>
            <button 
              onClick={handleGenerateMedia}
              disabled={loadingMedia}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {loadingMedia ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              Generate {post.mediaType === MediaType.VIDEO ? 'Video' : 'Image'}
            </button>
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                post.status === PostStatus.POSTED ? 'bg-green-100 text-green-700 border border-green-200' : 
                post.status === PostStatus.SCHEDULED ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
                {post.status}
            </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-800 text-lg mb-2 truncate" title={post.topic}>{post.topic}</h3>
        
        {isEditing ? (
          <div className="mb-4">
            <textarea 
              className="w-full border rounded-xl p-3 text-sm text-slate-600 h-24 focus:ring-2 focus:ring-indigo-500 outline-none border-slate-200"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-slate-400">Cancel</button>
                <button onClick={handleSaveCaption} className="text-xs font-bold bg-indigo-500 text-white px-3 py-1.5 rounded-lg">Save</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed flex-1 font-medium">
            {post.caption}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {post.hashtags.map((tag, i) => (
            <span key={i} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-2 py-0.5 rounded-md">#{tag}</span>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-5 border-t border-slate-100 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(true)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <i className="fas fa-edit"></i>
              </button>
              <button onClick={() => onDelete(post.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <i className="fas fa-trash"></i>
              </button>
            </div>
            
            <button 
              onClick={() => handleStatusChange(PostStatus.SCHEDULED)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              Schedule Post
            </button>
          </div>

          {post.status !== PostStatus.POSTED && (
              <div className="flex gap-2 w-full">
                {xConnection && (
                  <button 
                    onClick={handlePublishToX}
                    disabled={isPublishing}
                    className="flex-1 bg-black text-white px-3 py-3 rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
                  >
                    {isPublishing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-x-twitter"></i>}
                    Publish to X
                  </button>
                )}
                <button 
                  onClick={() => handleStatusChange(PostStatus.POSTED)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-3 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                >
                  Mark Posted
                </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
