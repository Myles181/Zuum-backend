exports.createBeatPost = async(req, res) => {
    try {
        const {} = req.body;
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}