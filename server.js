// Get single contract endpoint
app.get('/api/v1/contracts/:id', (req, res) => {
    const contract = contracts.find(c => c.id === parseInt(req.params.id));
    if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
    }
    res.json(contract);
}); 