const asynceHandler = (fn) => {
   ( req, res, next) => {
    Promise.resolve(fn(req, res, next))
    .catch((error) => next(error));
   }

}

export default asynceHandler;