(ns net.littleredcomputer.math.api.foo
  (:require [ring.util.response :refer [response]]
            [ring.util.servlet :refer [defservice]]
            [clojure.tools.logging :as log]
            [ring.middleware.defaults :refer [wrap-defaults api-defaults]]
            [ring.middleware.json :refer [wrap-json-response]]
            [compojure.core :refer [defroutes GET POST]]
            [hiccup.core :refer :all])
  (:gen-class :extends javax.servlet.http.HttpServlet))

(defn bar [a b] (+ a b))

(defroutes
  foo
  (GET "/foo/1" {}
       (html [:html [:body [:p "Hello from /foo/1"]]]))
  (GET "/foo/2" {}
       (html [:html [:body [:p "Hello from /foo/2"]]])))

(defservice (-> foo
                wrap-json-response
                (wrap-defaults api-defaults)))
