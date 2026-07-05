/**
 * Strips authorId from post if isAnonymous is true.
 * Must be used on a Mongoose document or lean object.
 */
export const applyAnonymity = (post) => {
  const postObj = post.toObject ? post.toObject() : { ...post };
  if (postObj.isAnonymous) {
    delete postObj.authorId;
  }
  if (postObj.comments && Array.isArray(postObj.comments)) {
    postObj.comments = postObj.comments.map(comment => {
      if (comment.isAnonymous) {
        delete comment.authorId;
      }
      return comment;
    });
  }
  return postObj;
};
