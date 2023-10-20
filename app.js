// jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser"); // Import bodyParser for parsing request bodies.
const _=require("lodash")

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true })); // Use bodyParser for parsing request bodies.
app.use(express.static("public"));

mongoose.connect('mongodb+srv://mokhtarinformation:VpGfp8HwjQG9K9p6@cluster0.uxojoge.mongodb.net/todoList', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const Pencil = new Item({
  name: "Welcome to your to-do list"
});

const Pen = new Item({
  name: "Hit the + button to add a new item"
});

const TShirt = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [Pencil, Pen, TShirt];

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log('Successfully saved default items');
            res.redirect("/");
          })
          .catch((error) => {
            console.error('Error inserting default items:', error);
          });
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch((error) => {
      console.error('Error finding items:', error);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list; // Fix variable name 'listName' (was 'listName' in the code but used as 'customListName' later).
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch((error) => {
        console.error('Error saving item:', error);
      });

  } else {
    List.findOne({ name: listName }) // Use 'listName' instead of 'customListName'.
      .then((foundList) => {
        foundList.items.push(item); // Push the item to the 'items' array of the list.
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((error) => {
        console.error('Error finding/saving custom list:', error);
      });
  }
});

app.post("/delete", function (req, res) {
  const theCheckItemId = req.body.checkbox;
  const listoName = req.body.listName;

  if (listoName === "Today") {
    Item.findByIdAndRemove(theCheckItemId)
      .then((deletedItem) => {
        console.log('Successfully deleted item:', deletedItem);
        return res.redirect("/");
      })
      .catch((error) => {
        console.error('Error deleting item:', error);
        return res.redirect("/");
      });
  } else {
    List.findOneAndUpdate(
      { name: listoName },
      { $pull: { items: { _id: theCheckItemId } } }
    )
      .then((result) => {
        console.log('Successfully removed item from custom list:', result);
        return res.redirect("/" + listoName);
      })
      .catch((error) => {
        console.error('Error updating custom list:', error);
        return res.redirect("/" + listoName);
      });
  }
});


app.get("/work", function (req, res) {
  Item.find({})
    .then((foundItems) => {
      res.render("list", { listTitle: "Work List", newListItems: foundItems });
    })
    .catch((error) => {
      console.error('Error finding items:', error);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        console.log("doesnt exist");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        return list.save();
      } else {
        console.log("exist");
        return foundList;
      }
    })
    .then((list) => {
      res.render("list", { listTitle: list.name, newListItems: list.items });
    })
    .catch((error) => {
      console.error('Error finding/saving custom list:', error);
    });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
