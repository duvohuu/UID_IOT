app.get("/api/work-shifts", async (req, res) => {
    try {
        const token = req.cookies.authToken;
        const queryString = new URLSearchParams(req.query).toString();
        
        const response = await axios.get(`${DB_SERVER_URL}/db/work-shifts?${queryString}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Get work shifts error:", error.message);
        if (error.response?.status === 401) {
            return res.status(401).json({ message: "Unauthorized - Please login again" });
        }
        res.status(500).json({ 
            message: "Error fetching work shifts", 
            error: error.message 
        });
    }
});

app.get("/api/work-shifts/:shiftId", async (req, res) => {
    try {
        const { shiftId } = req.params;
        const token = req.cookies.authToken;
        
        const response = await axios.get(`${DB_SERVER_URL}/db/work-shifts/${shiftId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Get work shift detail error:", error.message);
        if (error.response?.status === 401) {
            return res.status(401).json({ message: "Unauthorized - Please login again" });
        }
        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Work shift not found" });
        }
        res.status(500).json({ 
            message: "Error fetching work shift detail", 
            error: error.message 
        });
    }
});