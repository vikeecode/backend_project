import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req , file, cb) {
        cb(null, './public/temp')
    },
    filename: function (req, file, cd) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '-' + file.originalname)
        console.log("File name:", file.originalname);
        
    }
})

export const upload = multer({
    storage,
})
