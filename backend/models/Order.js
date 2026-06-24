const mongoose= require("mongoose");
const orderSchema=new mongoose.Schema({
    client:{
        fullName:{
            type:String,
            required:true,
            trim:true
        }
    },
    email:{
        type:String,
        required:true,
        trim:true
    },
    phone:{
        type:String,
        required:true,
        trim:true
    },
    project:{
        notes:{
            type:String,
            trim:true
        }
    },
    baseTier:{
        key: String,
        name: String,
        price: Number
    },
    selectedAddOns:{
        key: String,
        name: String,
        price: Number
    },
    addOnsTotal:{
        type:Number,
        default:0
    },
    maintenance:{
        months:{
            type:Number,
            default:0
        },
        total:{
            type:Number,
            default:0
        }
    },
    hosting:{
        selected:{
            type:Boolean,
            default:false
        },
        total:{
            type:Number,
            default:0
        }
    },
    vat:{
        rate:{
            type:Number,
            default:0.16
        },
        amount:{
            type:Number,
            default:0
        }
    },
    estimatedRange:{
        high: Number,
        low: Number
    },
    status:{
        type:String,
        enum:["approved", "rejected","done"],
        default:"approved"
    },
},
{
    timestamps:true
}
)
module.exports=mongoose.model("Order", orderSchema);