const Joi = require('joi');

const electionSchema = Joi.object({
    election_id: Joi.number().required(),
    election_name: Joi.string().max(200).required(),
    election_type: Joi.string().valid('fptp', 'preferential', 'block').required()
});

module.exports = {
    electionSchema
};
