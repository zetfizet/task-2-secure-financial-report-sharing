import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:5001/api",
  // you can add headers here if JWT is later implemented
});
