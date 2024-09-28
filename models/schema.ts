import mongoose from "mongoose";
import  { Schema,model} from "mongoose"



// User Schema
const UserSchema = new Schema({
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

const Users = mongoose.models.user || model('user', UserSchema);

// Report Schema
const reportSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
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
        type: mongoose.Schema.Types.Mixed,      // Use Mixed for JSON-like data
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: "pending",
    },
    collectorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    }
}, {
    timestamps: true,
});

const Reports = mongoose.models.report || model('report', reportSchema);


//Reward Schema

const rewardSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
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

const Rewards = mongoose.models.reward || model('reward', rewardSchema);


//ColectedWaste Schema


const CollectedWasteSchema = new Schema({

    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'report',
        required: true,
    },
    collectorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    collectedDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: String,
        required: true,
        default: "collected"
    }

}, {
    timestamps: true
});

const CollectedWastes = mongoose.models.collectedWaste || model('collectedWaste', CollectedWasteSchema);


//notifiaction schema

const notificationSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
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


const Notifications = mongoose.models.notification || model('notification', notificationSchema);


const transactionSchema = new Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
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

const Transactions = mongoose.models.transaction || model('transaction', transactionSchema);




export {
    Users,
    Reports,
    Rewards,
    CollectedWastes,
    Notifications,
    Transactions
};
