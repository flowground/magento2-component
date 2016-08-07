{
    "type": "array",
    "properties": {
        "name": {
            "type": "string",
            "required": false,
            "title": "Product name"
        },
        "price": {
            "type": "string",
            "required": false,
            "title": "Product price"
        },
        "sku": {
            "type": "string",
            "required": false,
            "title": "Product sku"
        },
        "categories": {
          "type": "array",
          "properties": {
            "name": {
              "type": "string",
              "required": false,
              "title": "Category name"
            }
            "parent": {
              "type": "string",
              "required": false,
              "title": "Parent category name"
            }
          }
        }
    }
}
