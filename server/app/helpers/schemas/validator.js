const validator = schema => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    const valid = error == null;

    if (valid) {
      next();
    } else {
      const { details } = error;
      const message = details.map(i => i.message).join(",");
      res.status(422).json({ message });
    }
  };
};
const reqQueryValidator = schema => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    const valid = error == null;

    if (valid) {
      next();
    } else {
      const { details } = error;
      const message = details.map(i => i.message).join(",");
      res.status(422).json({ message });
    }
  };
};
module.exports = {validator,reqQueryValidator};
