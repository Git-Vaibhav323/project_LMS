declare namespace Express {
  interface Request {
    faculty?: import("./index").AuthenticatedFaculty;
  }
}
