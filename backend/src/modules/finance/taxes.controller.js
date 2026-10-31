const taxesService = require('./taxes.service');

async function list(req, res, next) {
    try {
        const result = await taxesService.listTaxRates(req.query);
        res.json({ status: 'success', ...result });
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const tax = await taxesService.getTaxRateById(req.params.id);
        if (!tax) return res.status(404).json({ status: 'error', message: 'Tax rate not found.' });
        res.json({ status: 'success', data: tax });
    } catch (err) { next(err); }
}

async function create(req, res, next) {
    try {
        const tax = await taxesService.createTaxRate(req.body);
        res.status(201).json({ status: 'success', message: 'Tax rate created.', data: tax });
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const tax = await taxesService.updateTaxRate(req.params.id, req.body);
        res.json({ status: 'success', message: 'Tax rate updated.', data: tax });
    } catch (err) { next(err); }
}

async function remove(req, res, next) {
    try {
        const tax = await taxesService.deleteTaxRate(req.params.id);
        res.json({ status: 'success', message: `Tax rate "${tax.name}" deleted.`, data: tax });
    } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
