import _ from 'lodash';
import { success, notFound } from '../../services/response';
import { Category } from '.';

export const create = ({ bodymen: { body }, user }, res, next) => Category.create({
  ...body,
  createdBy: user._id,
})
  .then((category) => category.view(true))
  .then(success(res, 201))
  .catch(next);

export const index = ({ querymen: { query, select, cursor } }, res, next) => {
  console.log(query);
  return (
    Category.find({ active: true, ...query }, select, cursor)
      .then((categories) => categories.map((category) => category.view()))
      .then(success(res))
      .catch(next)
  );
};

export const show = ({ params }, res, next) => Category.findById(params.id)
  .then(notFound(res))
  .then((category) => (category ? category.view() : null))
  .then(success(res))
  .catch(next);

export const showBySlug = ({ params }, res, next) => Category.findOne({ slug: params.id })
  .then(notFound(res))
  .then((category) => (category ? category.view() : null))
  .then(success(res))
  .catch(next);

export const update = ({ bodymen: { body }, params }, res, next) => Category.findById(params.id)
  .then(notFound(res))
  .then((category) => (category ? _.merge(category, body).save() : null))
  .then((category) => (category ? category.view(true) : null))
  .then(success(res))
  .catch(next);

export const destroy = ({ params }, res, next) => Category.findById(params.id)
  .then(notFound(res))
  .then((category) => (category ? category.remove() : null))
  .then(success(res, 204))
  .catch(next);
