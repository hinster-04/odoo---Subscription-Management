const svc = require('./discounts.service');

async function list(req, res, next) {
    try { res.json({ status: 'success', ...(await svc.listDiscounts(req.query)) }); }
    catch (err) { next(err); }
}
async function getById(req, res, next) {
    try {
        const d = await svc.getDiscountById(req.params.id);
        if (!d) return res.status(404).json({ status: 'error', message: 'Discount not found.' });
        res.json({ status: 'success', data: d });
    } catch (err) { next(err); }
}
async function create(req, res, next) {
    try {
        const d = await svc.createDiscount(req.body);
        res.status(201).json({ status: 'success', message: 'Discount created.', data: d });
    } catch (err) { next(err); }
}
async function update(req, res, next) {
    try {
        const d = await svc.updateDiscount(req.params.id, req.body);
        res.json({ status: 'success', message: 'Discount updated.', data: d });
    } catch (err) { next(err); }
}
async function remove(req, res, next) {
    try {
        const d = await svc.deleteDiscount(req.params.id);
        res.json({ status: 'success', message: `Discount "${d.name}" deleted.`, data: d });
    } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
