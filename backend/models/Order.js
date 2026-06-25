const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      companyName: {
        type: String,
        trim: true,
      },
      preferredContact: {
        type: String,
        enum: ["email", "phone", "whatsapp"],
        default: "email",
      },
    },

    project: {
      notes: {
        type: String,
        trim: true,
      },

      baseTier: {
        key: String,
        name: String,
        price: Number,
      },

      selectedAddons: [
        {
          key: String,
          name: String,
          price: Number,
        },
      ],

      addonsTotal: {
        type: Number,
        default: 0,
      },

      maintenance: {
        months: {
          type: Number,
          default: 0,
        },
        total: {
          type: Number,
          default: 0,
        },
      },

      hosting: {
        selected: {
          type: Boolean,
          default: false,
        },
        total: {
          type: Number,
          default: 0,
        },
      },

      vat: {
        rate: {
          type: Number,
          default: 0.16,
        },
        amount: {
          type: Number,
          default: 0,
        },
      },

      estimatedTotal: {
        type: Number,
        required: true,
      },

      estimatedRange: {
        low: Number,
        high: Number,
      },
    },

    status: {
      type: String,
      enum: ["new", "approved", "rejected", "done"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);