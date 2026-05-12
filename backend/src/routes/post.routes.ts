import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { VoteController } from '../controllers/vote.controller';
import { CommentController } from '../controllers/comment.controller';
import { SaveController } from '../controllers/save.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { createPostSchema, updatePostSchema } from '../validators/post.validator';

export const postRouter = Router();
const post = new PostController();
const vote = new VoteController();
const comment = new CommentController();
const save = new SaveController();

// /following must come before /:id
postRouter.get('/following', authenticate, post.getFollowingFeed);

postRouter.get('/', optionalAuthenticate, post.getFeed);
postRouter.get('/:id', optionalAuthenticate, post.getById);
postRouter.post('/', authenticate, validate(createPostSchema), post.create);
postRouter.patch('/:id', authenticate, validate(updatePostSchema), post.update);
postRouter.delete('/:id', authenticate, post.delete);

// Votes
postRouter.post('/:id/vote', authenticate, vote.castPostVote);

// Comments
postRouter.get('/:id/comments', comment.getByPost);
postRouter.post('/:id/comments', authenticate, comment.create);
postRouter.delete('/:id/comments/:commentId', authenticate, comment.delete);

// Saves
postRouter.post('/:id/save', authenticate, save.toggle);
