import mongoose from "mongoose";




// User Schema
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

const Users =  mongoose.model('User', UserSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    wasteType: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    verification_result: {
        type: mongoose.Schema.Types.Mixed, // Use Mixed for JSON-like data
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: "pending",
    },
    collectorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true,
});

const Reports = mongoose.model('Report', reportSchema);


//Reward Schema

const rewardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    points: {
        type: Number,
        required: true,
        default: 0,
    },
    isAvailable: {
        type: Boolean,
        required: true,
        default: true
    },
    description: {
        type: String,
    },
    name: {
        type: String,
        required: true
    },
    collectionInfo: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const Rewards = mongoose.model('Reward', rewardSchema);


//ColectedWaste Schema


const CollectedWasteSchema = new mongoose.Schema({

    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true,
    },
    collectorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    collectedDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: "collected"
    }

}, {
    timestamps: true
});

const CollcetedWastes = mongoose.model('CollectedWaste', CollectedWasteSchema);


//notifiaction schema

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: true
});


const Notifications = mongoose.model('Notification', notificationSchema);


const transactionSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    }
});

const Transactions =mongoose.model('Transaction', transactionSchema);




export {
    Users,
    Reports,
    Rewards,
    CollcetedWastes,
    Notifications,
    Transactions
};
