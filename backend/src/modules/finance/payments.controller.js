const svc = require('./payments.service');

async function list(req, res, next) {
    try { res.json({ status: 'success', ...(await svc.listPayments(req.query)) }); }
    catch (err) { next(err); }
}
async function getById(req, res, next) {
    try {
        const p = await svc.getPaymentById(req.params.id);
        if (!p) return res.status(404).json({ status: 'error', message: 'Payment not found.' });
        res.json({ status: 'success', data: p });
    } catch (err) { next(err); }
}
async function record(req, res, next) {
    try {
        const p = await svc.recordPayment(req.body);
        res.status(201).json({ status: 'success', message: 'Payment recorded successfully.', data: p });
    } catch (err) { next(err); }
}

module.exports = { list, getById, record };
