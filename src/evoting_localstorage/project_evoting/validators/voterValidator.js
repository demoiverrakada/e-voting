const Joi = require('joi');

const voterSchema = Joi.object({
    voter_id: Joi.string().required(),
    name: Joi.string().required(),
    election_id: Joi.number().required()
});

module.exports = {
    voterSchema
};
