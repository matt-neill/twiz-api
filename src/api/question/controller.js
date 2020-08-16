import { success, notFound } from '../../services/response/';
import { Question } from '.';
import fs from 'fs';
import parseFile from './parse';
import parseText from '../../utils/parseText';
import titleCase from '../../utils/titleCase';
import { json } from 'body-parser';

export const create = ({ bodymen: { body }, user}, res, next) => 
  Question.create({ ...body, createdBy: user })
    .then((question) => question.view(true))
    .then(success(res, 201))
    .catch(next)

export const createMultiple = ({ body, user }, res, next) => {
  let p = [];
  const { questions, createdAt } = body;
  questions.map((question) => p.push(
    Question.create({
        ...question,
        createdBy: user._id,
        lastUsed: createdAt || new Date(),
    })
  ));
  return Promise.all(p)
    .then(success(res, 201))
    .catch(next)
}

export const index = ({ querymen: { query, select, cursor }, user}, res, next) => {

  if (query.category && query.category['$in']) { // fixes querymen bug where multiple fields change the operator to "$in"
    delete Object.assign(query, {category: {['$nin']: query.category['$in'] }})[query.category['$in']]; 
  }

  if (user.role === 'user') {
    query.createdBy = user;
  }

  return Question.count(query)
    .then(count => Question.find(query, select, cursor)
    .populate('createdBy', 'name picture')
    .then((questions) => ({
      count,
      rows: questions.map((question) => question.view())
    }))
    )
    .then(success(res))
    .catch(next)
}

export const show = ({ params, user }, res, next) => {
  const query = { _id: params.id };
  if (user.role === 'user') {
    query.createdBy = user;
  }

  return Question.findOne(query)
  .populate('createdBy', 'name picture')
  .then(notFound(res))
  .then((question) => question ? question.view() : null)
  .then(success(res))
  .catch(next)
}
  
export const update = ({ bodymen: { body }, params, user }, res, next) => {
  const query = { _id: params.id };
  if (user.role === 'user') {
    query.createdBy = user;
  }

  return Question.findOne(query)
  .then(notFound(res))
  .then((question) => question ? Object.assign(question, Object.assign(body, { updatedAt: new Date() })).save() : null)
  .then((question) => question ? question.view(true) : null)
  .then(success(res))
  .catch(next)
}
  
export const destroy = ({ params, user }, res, next) => {
  const query = { _id: params.id };
  if (user.role === 'user') {
    query.createdBy = user;
  }

  return Question.findOne(query)
    .then(notFound(res))
    .then((question) => question ? question.remove() : null)
    .then(success(res, 204))
    .catch(next)
}


export const upload = ({ user, file }, res, next) => {
  parseFile(file.path).then((questions) => {
    fs.unlinkSync(file.path);
    return res.json({
      questions
    });
  })
}

export const parseMultiple = (req, res, next) => {
  const {
    questions,
    type,
    category,
  } = req.body;

  const categories = category.split('&').map((category) => titleCase(category).trim());
  const questionsSplit = questions.split('\n');
  let returnQuestions = [];

  if (type === 'text' || type === 'mc') {
    returnQuestions = questionsSplit.map((question,idx) => {
      const isFirstHalf = idx >= Math.ceil(questionsSplit.length/2) ? 1 : 0; // determine if question is in first half of array
      const questionObj = {
        ...parseText(question),
        id: idx,
        category: categories[categories.length > 1 ? isFirstHalf : 0], // set category name based off of array position
      }
      return questionObj;
    });
  }
  return res.json(returnQuestions);
};