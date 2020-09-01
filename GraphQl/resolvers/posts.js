const { AuthenticationError, UserInputError } = require("apollo-server");
const Post = require("../../models/Post");
const checkAuth = require("../../util/CheckAuth");
const { argsToArgsConfig } = require("graphql/type/definition");

module.exports = {
    Query: {
        async getPosts() {
            try {
                const posts = await Post.find().sort({ createdAt: -1 });
                return posts;
            } catch (err) {
                throw new Error(err);
            }
        },
        async getPost(_, { postId }) {
            try {
                const post = await Post.findById(postId);
                if (post) {
                    return post;
                } else {
                    throw new Error("Post not found");
                }
            } catch (err) {
                throw new Error(err);
            }
        },
    },
    Mutation: {
        createPost: async (_, { body }, context) => {
            const user = checkAuth(context);

            if (body.trim() === "") {
                throw new Error("Post body must not be empty");
            }

            const newPost = new Post({
                body,
                user: user.id,
                username: user.username,
                createdAt: new Date().toISOString(),
            });

            const post = await newPost.save();

            return post;
        },
        deletePost: async (_, { postId }, context) => {
            const user = checkAuth(context);

            try {
                const post = await Post.findById(postId);

                if (post) {
                    if (user.username === post.username) {
                        await post.delete();
                        return "Post deleted successfully";
                    } else {
                        throw new AuthenticationError("Action not allowed");
                    }
                } else {
                    throw new Error("Post not found");
                }
            } catch (err) {
                throw new Error(err);
            }
        },
        likePost: async (_, { postId }, context) => {
            const { username } = checkAuth(context);

            const post = await Post.findById(postId);

            if (post) {
                if (post.likes.find((like) => like.username === username)) {
                    // post already liked unlike it
                    post.likes = post.likes.filter(
                        (like) => like.username !== username
                    );
                } else {
                    // not liked yet, like post
                    post.likes.push({
                        username,
                        createdAt: new Date().toISOString(),
                    });
                    await post.save();
                    return post;
                }
                await post.save();
                return post;
            } else throw new UserInputError("Post not found");
        },
    },
};