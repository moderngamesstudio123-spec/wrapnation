export const DEFAULT_ADDONS = [
  {
    "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
    "name": "Extra Mayonnaise",
    "price": 1000,
    "isCustomPrice": false
  },
  {
    "id": "4641d118-4170-4c99-b2b2-e08987971577",
    "name": "Extra Cheese",
    "price": 1000,
    "isCustomPrice": false
  },
  {
    "id": "0364a960-d999-47cf-a556-5801dc639c09",
    "name": "Cold Drink",
    "price": 4000,
    "isCustomPrice": true
  }
];

export const DEFAULT_CATEGORIES = [
  {
    "id": "6cf2a96d-a52f-4d17-9b8d-64a3d05e9a72",
    "name": "Wraps",
    "slug": "wraps",
    "sortOrder": 1,
    "isActive": true,
    "items": [
      {
        "id": "0454b2d1-d378-49e7-8128-252908b66449",
        "name": "Chicken Wrap",
        "description": "Juicy spiced grilled chicken rolled in soft warm flatbread with house sauces.",
        "basePrice": 13000,
        "imageUrl": "/images/food/wrap.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 1,
        "categoryId": "6cf2a96d-a52f-4d17-9b8d-64a3d05e9a72",
        "variants": [
          {
            "id": "d1157f47-33d2-4fe0-9d95-3f0305b88aae",
            "menuItemId": "0454b2d1-d378-49e7-8128-252908b66449",
            "name": "Combo (Adds Fries + Cold Drink)",
            "priceDelta": 6000,
            "isAvailable": true
          }
        ],
        "addOnLinks": [
          {
            "menuItemId": "0454b2d1-d378-49e7-8128-252908b66449",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "0454b2d1-d378-49e7-8128-252908b66449",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "0454b2d1-d378-49e7-8128-252908b66449",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "66c4544d-7cc6-4be4-a255-2816651d726f",
        "name": "Cheesy Chicken Wrap",
        "description": "Loaded with melted cheddar, succulent chicken pieces and signature seasoning.",
        "basePrice": 14000,
        "imageUrl": "/images/food/wrap.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 2,
        "categoryId": "6cf2a96d-a52f-4d17-9b8d-64a3d05e9a72",
        "variants": [
          {
            "id": "ae943bfd-d589-47f5-8999-2dd2f46b644d",
            "menuItemId": "66c4544d-7cc6-4be4-a255-2816651d726f",
            "name": "Combo (Adds Fries + Cold Drink)",
            "priceDelta": 6000,
            "isAvailable": true
          }
        ],
        "addOnLinks": [
          {
            "menuItemId": "66c4544d-7cc6-4be4-a255-2816651d726f",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "66c4544d-7cc6-4be4-a255-2816651d726f",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "66c4544d-7cc6-4be4-a255-2816651d726f",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "7e28dfc1-516b-425d-b193-8a5dacaa84de",
        "name": "Fish Wrap",
        "description": "Golden crumb-fried fish fillet with tangy tartar and crisp lettuce.",
        "basePrice": 13000,
        "imageUrl": "/images/food/wrap.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 3,
        "categoryId": "6cf2a96d-a52f-4d17-9b8d-64a3d05e9a72",
        "variants": [
          {
            "id": "d1f994c9-5cff-49a3-a175-bd0cbe9a4894",
            "menuItemId": "7e28dfc1-516b-425d-b193-8a5dacaa84de",
            "name": "Combo (Adds Fries + Cold Drink)",
            "priceDelta": 6000,
            "isAvailable": true
          }
        ],
        "addOnLinks": [
          {
            "menuItemId": "7e28dfc1-516b-425d-b193-8a5dacaa84de",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "7e28dfc1-516b-425d-b193-8a5dacaa84de",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "7e28dfc1-516b-425d-b193-8a5dacaa84de",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "2095a5aa-9445-4907-96de-0ebccc3a9cf0",
        "name": "Chicken Nugget Wrap",
        "description": "Crunchy chicken nuggets wrapped with fresh greens and creamy garlic mayo.",
        "basePrice": 13000,
        "imageUrl": "/images/food/wrap.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 4,
        "categoryId": "6cf2a96d-a52f-4d17-9b8d-64a3d05e9a72",
        "variants": [
          {
            "id": "9ec35678-57d2-4b5d-b271-b3309d9cb101",
            "menuItemId": "2095a5aa-9445-4907-96de-0ebccc3a9cf0",
            "name": "Combo (Adds Fries + Cold Drink)",
            "priceDelta": 6000,
            "isAvailable": true
          }
        ],
        "addOnLinks": [
          {
            "menuItemId": "2095a5aa-9445-4907-96de-0ebccc3a9cf0",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "2095a5aa-9445-4907-96de-0ebccc3a9cf0",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "2095a5aa-9445-4907-96de-0ebccc3a9cf0",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "b64e7aec-04a7-41fa-8100-6c84203f4d8b",
        "name": "Veg Wrap",
        "description": "Crisp vegetable patty with creamy herb dressing, crunchy onions and lettuce.",
        "basePrice": 12000,
        "imageUrl": "/images/food/wrap.jpg",
        "isVeg": true,
        "isAvailable": true,
        "sortOrder": 5,
        "categoryId": "6cf2a96d-a52f-4d17-9b8d-64a3d05e9a72",
        "variants": [
          {
            "id": "0b5567f1-46d2-4d7c-bc46-76ad0dc8ee7b",
            "menuItemId": "b64e7aec-04a7-41fa-8100-6c84203f4d8b",
            "name": "Combo (Adds Fries + Cold Drink)",
            "priceDelta": 4000,
            "isAvailable": true
          }
        ],
        "addOnLinks": [
          {
            "menuItemId": "b64e7aec-04a7-41fa-8100-6c84203f4d8b",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "b64e7aec-04a7-41fa-8100-6c84203f4d8b",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "b64e7aec-04a7-41fa-8100-6c84203f4d8b",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      }
    ]
  },
  {
    "id": "3c58244c-85dd-48f9-8847-82ef6dfb1715",
    "name": "Burgers",
    "slug": "burgers",
    "sortOrder": 2,
    "isActive": true,
    "items": [
      {
        "id": "70d893f5-e34a-4cd3-bb8e-9f2a74fb3ae5",
        "name": "Zinger Burger",
        "description": "Extra crispy chicken breast tossed in hot spices with shredded lettuce and sesame bun.",
        "basePrice": 11000,
        "imageUrl": "/images/food/burger.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 1,
        "categoryId": "3c58244c-85dd-48f9-8847-82ef6dfb1715",
        "variants": [
          {
            "id": "cffb7bf1-36da-48ba-98c8-85d3b432d48c",
            "menuItemId": "70d893f5-e34a-4cd3-bb8e-9f2a74fb3ae5",
            "name": "Combo (Adds Fries + Cold Drink)",
            "priceDelta": 6000,
            "isAvailable": true
          }
        ],
        "addOnLinks": [
          {
            "menuItemId": "70d893f5-e34a-4cd3-bb8e-9f2a74fb3ae5",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "70d893f5-e34a-4cd3-bb8e-9f2a74fb3ae5",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "70d893f5-e34a-4cd3-bb8e-9f2a74fb3ae5",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "e91947fb-2119-48f4-82dd-67d117ae0055",
        "name": "Chicken Nugget Burger",
        "description": "Golden chicken nuggets layered with melted cheese slice and spicy mayo.",
        "basePrice": 11000,
        "imageUrl": "/images/food/burger.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 2,
        "categoryId": "3c58244c-85dd-48f9-8847-82ef6dfb1715",
        "variants": [
          {
            "id": "fa79dedf-538c-4c3a-99e8-f1d0acad1f8b",
            "menuItemId": "e91947fb-2119-48f4-82dd-67d117ae0055",
            "name": "Combo (Adds Fries + Cold Drink)",
            "priceDelta": 6000,
            "isAvailable": true
          }
        ],
        "addOnLinks": [
          {
            "menuItemId": "e91947fb-2119-48f4-82dd-67d117ae0055",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "e91947fb-2119-48f4-82dd-67d117ae0055",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "e91947fb-2119-48f4-82dd-67d117ae0055",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "f046c90c-a265-45a1-93ae-ae190483f6d7",
        "name": "Veg Burger",
        "description": "Classic crunchy potato & peas patty with secret spice rub and herb mayo.",
        "basePrice": 7000,
        "imageUrl": "/images/food/burger.jpg",
        "isVeg": true,
        "isAvailable": true,
        "sortOrder": 3,
        "categoryId": "3c58244c-85dd-48f9-8847-82ef6dfb1715",
        "variants": [
          {
            "id": "b7a3addf-0763-43a7-a14b-f31620081187",
            "menuItemId": "f046c90c-a265-45a1-93ae-ae190483f6d7",
            "name": "Combo (Adds Fries + Cold Drink)",
            "priceDelta": 6000,
            "isAvailable": true
          }
        ],
        "addOnLinks": [
          {
            "menuItemId": "f046c90c-a265-45a1-93ae-ae190483f6d7",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "f046c90c-a265-45a1-93ae-ae190483f6d7",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "f046c90c-a265-45a1-93ae-ae190483f6d7",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      }
    ]
  },
  {
    "id": "b32ec812-d701-4859-9c71-53d4cc3366e9",
    "name": "Fried Chicken",
    "slug": "fried-chicken",
    "sortOrder": 3,
    "isActive": true,
    "items": [
      {
        "id": "c793b412-9e19-4da6-98b2-a9c7f67e5586",
        "name": "Fried Chicken 4 pcs",
        "description": "Hand-breaded juicy chicken pieces, fried golden with our signature 11-spice crust.",
        "basePrice": 22000,
        "imageUrl": "/images/food/fried-chicken.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 1,
        "categoryId": "b32ec812-d701-4859-9c71-53d4cc3366e9",
        "variants": [],
        "addOnLinks": [
          {
            "menuItemId": "c793b412-9e19-4da6-98b2-a9c7f67e5586",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "c793b412-9e19-4da6-98b2-a9c7f67e5586",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "c793b412-9e19-4da6-98b2-a9c7f67e5586",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "8ff4e471-6c4f-4631-a1b3-eaf55c43e00b",
        "name": "Fried Chicken 8 pcs",
        "description": "Sharing bucket of 8 pieces crispy fried chicken, tender inside and crunchy outside.",
        "basePrice": 42000,
        "imageUrl": "/images/food/fried-chicken.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 2,
        "categoryId": "b32ec812-d701-4859-9c71-53d4cc3366e9",
        "variants": [],
        "addOnLinks": [
          {
            "menuItemId": "8ff4e471-6c4f-4631-a1b3-eaf55c43e00b",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "8ff4e471-6c4f-4631-a1b3-eaf55c43e00b",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "8ff4e471-6c4f-4631-a1b3-eaf55c43e00b",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "de4c9b94-f555-4ae2-99e0-961bfd8a07c8",
        "name": "Combo Fried Chicken 4 pcs + Fries + Cool Drink",
        "description": "4 pcs crispy fried chicken with hot salted French fries and chilled beverage.",
        "basePrice": 29000,
        "imageUrl": "/images/food/fried-chicken.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 3,
        "categoryId": "b32ec812-d701-4859-9c71-53d4cc3366e9",
        "variants": [],
        "addOnLinks": [
          {
            "menuItemId": "de4c9b94-f555-4ae2-99e0-961bfd8a07c8",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "de4c9b94-f555-4ae2-99e0-961bfd8a07c8",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "de4c9b94-f555-4ae2-99e0-961bfd8a07c8",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "c3605588-7f1e-40cf-be37-7ecc93e0cf8d",
        "name": "Combo Fried Chicken 8 pcs + Fries + Cool Drink",
        "description": "8 pcs fried chicken feast accompanied by large fries and chilled beverage.",
        "basePrice": 49000,
        "imageUrl": "/images/food/fried-chicken.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 4,
        "categoryId": "b32ec812-d701-4859-9c71-53d4cc3366e9",
        "variants": [],
        "addOnLinks": [
          {
            "menuItemId": "c3605588-7f1e-40cf-be37-7ecc93e0cf8d",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "c3605588-7f1e-40cf-be37-7ecc93e0cf8d",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "c3605588-7f1e-40cf-be37-7ecc93e0cf8d",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      }
    ]
  },
  {
    "id": "9aea29e5-968c-4dd8-b93b-959a12d24ef0",
    "name": "Snacks & Fries",
    "slug": "snacks",
    "sortOrder": 4,
    "isActive": true,
    "items": [
      {
        "id": "0441dcce-aa73-4474-b3c4-1adaedc3e0a2",
        "name": "French Fries",
        "description": "Classic golden salted potato fries, crispy outside and fluffy inside.",
        "basePrice": 8000,
        "imageUrl": "/images/food/french-fries.jpg",
        "isVeg": true,
        "isAvailable": true,
        "sortOrder": 1,
        "categoryId": "9aea29e5-968c-4dd8-b93b-959a12d24ef0",
        "variants": [],
        "addOnLinks": [
          {
            "menuItemId": "0441dcce-aa73-4474-b3c4-1adaedc3e0a2",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "0441dcce-aa73-4474-b3c4-1adaedc3e0a2",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "0441dcce-aa73-4474-b3c4-1adaedc3e0a2",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "b8a04ff6-ad38-4773-963d-0117296c6d51",
        "name": "Peri Peri Fries",
        "description": "Golden potato fries generously dusted with spicy tangy African peri peri seasoning.",
        "basePrice": 9000,
        "imageUrl": "/images/food/peri-peri-fries.jpg",
        "isVeg": true,
        "isAvailable": true,
        "sortOrder": 2,
        "categoryId": "9aea29e5-968c-4dd8-b93b-959a12d24ef0",
        "variants": [],
        "addOnLinks": [
          {
            "menuItemId": "b8a04ff6-ad38-4773-963d-0117296c6d51",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "b8a04ff6-ad38-4773-963d-0117296c6d51",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "b8a04ff6-ad38-4773-963d-0117296c6d51",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "4c26a08a-88b9-4662-b302-450946b42107",
        "name": "Chicken Nugget 6 pcs",
        "description": "6 pieces tender minced chicken nuggets coated in crispy breading.",
        "basePrice": 9000,
        "imageUrl": "/images/food/fried-chicken.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 3,
        "categoryId": "9aea29e5-968c-4dd8-b93b-959a12d24ef0",
        "variants": [],
        "addOnLinks": [
          {
            "menuItemId": "4c26a08a-88b9-4662-b302-450946b42107",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "4c26a08a-88b9-4662-b302-450946b42107",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "4c26a08a-88b9-4662-b302-450946b42107",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      },
      {
        "id": "edb6a2bc-9eb2-471e-845d-ea443f6de0c2",
        "name": "Chicken Nugget 12 pcs",
        "description": "12 pieces crunchy chicken nuggets served with dipping garlic dip.",
        "basePrice": 17000,
        "imageUrl": "/images/food/fried-chicken.jpg",
        "isVeg": false,
        "isAvailable": true,
        "sortOrder": 4,
        "categoryId": "9aea29e5-968c-4dd8-b93b-959a12d24ef0",
        "variants": [],
        "addOnLinks": [
          {
            "menuItemId": "edb6a2bc-9eb2-471e-845d-ea443f6de0c2",
            "addOnId": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
            "sortOrder": 1,
            "addOn": {
              "id": "b5b81eb4-8ae6-4239-8461-bd1fb5ff99ce",
              "name": "Extra Mayonnaise",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "edb6a2bc-9eb2-471e-845d-ea443f6de0c2",
            "addOnId": "4641d118-4170-4c99-b2b2-e08987971577",
            "sortOrder": 2,
            "addOn": {
              "id": "4641d118-4170-4c99-b2b2-e08987971577",
              "name": "Extra Cheese",
              "price": 1000,
              "isCustomPrice": false
            }
          },
          {
            "menuItemId": "edb6a2bc-9eb2-471e-845d-ea443f6de0c2",
            "addOnId": "0364a960-d999-47cf-a556-5801dc639c09",
            "sortOrder": 3,
            "addOn": {
              "id": "0364a960-d999-47cf-a556-5801dc639c09",
              "name": "Cold Drink",
              "price": 4000,
              "isCustomPrice": true
            }
          }
        ]
      }
    ]
  }
];
