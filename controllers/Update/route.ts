import express from "express";

const router : express.Router = express.Router();


router.get('/',async (req,res)=>{
    res.send("Nothing Right Now")
})

export default router;