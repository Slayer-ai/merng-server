const Post = require("../../models/Post");
const checkAuth = require("../../util/CheckAuth");
const { UserInputError, AuthenticationError } = require("apollo-server");

module.exports = {
    Mutation: {
        createComment: async (_, { postId, body }, context) => {
            const { username } = checkAuth(context);
            if (body.trim() === "") {
                throw new UserInputError("Empty comment", {
                    errors: {
                        body: "Comment body must not be empty",
                    },
                });
            }
            const post = await Post.findById(postId);

            if (post) {
                post.comments.unshift({
                    body,
                    username,
                    createdAt: new Date().toISOString(),
                });
                await post.save();
                return post;
            } else throw new UserInputError("Post not found");
        },

        deleteComment: async (_, { postId, commentId }, context) => {
            const { username } = checkAuth(context);
            const post = await Post.findById(postId);

            if (post) {
                const commentIndex = post.comments.findIndex(
                    (comment) => comment.id === commentId
                );

                let comment = post.comments[commentIndex];

                if (comment) {
                    if (comment.username === username) {
                        post.comments.splice(commentIndex, 1);
                        await post.save();
                        return post;
                    } else {
                        throw new AuthenticationError("Action not allowed");
                    }
                } else throw new UserInputError("Comment not found");
            } else {
                throw new UserInputError("Post not found");
            }
        },
    },
};