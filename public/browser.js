let skip = 0;

const generateTodos = () => {
  axios
    .get(`/read-item?skip=${skip}`)
    .then((res) => {
      if (res.data.status !== 200) {
        return alert(res.data.message);
      }
      console.log(skip);

      const todosArray = res.data.data;
      console.log(todosArray);
      skip += todosArray.length;
      console.log(skip);

      document.getElementById("item_list").insertAdjacentHTML(
        "beforeend",
        todosArray
          .map((item) => {
            return `<li class="card-body d-flex justify-content-between px-3 py-2 border align-items-center">
            <span class="item-text">${item.todo}</span>
            <div>
              <button
                class="edit-me btn-primary btn-sm mx-1"
                data-id="${item._id}"
              >
                Edit
              </button>
              <button class="delete-me btn-danger btn-sm" data-id="${item._id}">
                Delete
              </button>
            </div>
          </li>`;
          })
          .join("")
      );
    })
    .catch((err) => console.log(err));
};
window.onload = generateTodos;

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-me")) {
    const newData = prompt("enter edit todo");
    const todoId = e.target.getAttribute("data-id");

    axios
      .post("/edit-item", { newData, todoId })
      .then((res) => {
        if (res.data.status !== 200) {
          return alert(res.data.message);
        }

        e.target.parentElement.parentElement.querySelector(
          ".item-text"
        ).innerHTML = newData;
      })
      .catch((err) => console.log(err));
  } else if (e.target.classList.contains("delete-me")) {
    const todoId = e.target.getAttribute("data-id");

    axios
      .post("/delete-item", { todoId })
      .then((res) => {
        if (res.data.status !== 200) {
          return alert(res.data.message);
        }
        e.target.parentElement.parentElement.remove();
      })
      .catch((err) => console.log(err));
  } else if (e.target.classList.contains("add_item")) {
    const todo = document.getElementById("create_field").value;
    console.log(todo);

    axios
      .post("/create-item", { todo })
      .then((res) => {
        if (res.data.status !== 201) {
          return alert(res.data.message);
        }

        const createTodo = res.data.data;
        document.getElementById("create_field").value = "";

        document.getElementById("item_list").insertAdjacentHTML(
          "beforeend",
          `<li class="card-body d-flex justify-content-between px-3 py-2 border align-items-center">
            <span class="item-text">${createTodo.todo}</span>
            <div>
              <button
                class="edit-me btn-primary btn-sm mx-1"
                data-id="${createTodo._id}"
              >
                Edit
              </button>
              <button class="delete-me btn-danger btn-sm" data-id="${createTodo._id}">
                Delete
              </button>
            </div>
          </li>`
        );
      })
      .catch((err) => console.log(err));
  } else if (e.target.classList.contains("show_more")) {
    console.log("clicked");
    generateTodos();
  }
});
