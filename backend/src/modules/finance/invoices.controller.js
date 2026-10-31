const svc = require('./invoices.service');

async function list(req, res, next) {
    try { res.json({ status: 'success', ...(await svc.listInvoices(req.query)) }); }
    catch (err) { next(err); }
}
async function getById(req, res, next) {
    try {
        const inv = await svc.getInvoiceById(req.params.id);
        if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice not found.' });
        res.json({ status: 'success', data: inv });
    } catch (err) { next(err); }
}
async function create(req, res, next) {
    try {
        const inv = await svc.createInvoice(req.body);
        res.status(201).json({ status: 'success', message: 'Invoice created as draft.', data: inv });
    } catch (err) { next(err); }
}
async function update(req, res, next) {
    try {
        const inv = await svc.updateInvoice(req.params.id, req.body);
        res.json({ status: 'success', message: 'Invoice updated.', data: inv });
    } catch (err) { next(err); }
}
async function confirm(req, res, next) {
    try {
        const inv = await svc.confirmInvoice(req.params.id);
        res.json({ status: 'success', message: 'Invoice confirmed.', data: inv });
    } catch (err) { next(err); }
}
async function cancel(req, res, next) {
    try {
        const inv = await svc.cancelInvoice(req.params.id);
        res.json({ status: 'success', message: 'Invoice cancelled.', data: inv });
    } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, confirm, cancel };
