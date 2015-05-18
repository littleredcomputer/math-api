(ns net.littleredcomputer.math.api.rigid
  (:require [clojure.tools.logging :as log]
            [ring.util
             [response :refer [response content-type]]
             [servlet :refer [defservice]]]
            [ring.middleware
             [defaults :refer [wrap-defaults api-defaults]]
             [json :refer [wrap-json-response]]]
            [compojure.core :refer [defroutes GET POST]]
            [net.littleredcomputer.math.examples
             [rigid-rotation :refer [evolve-rigid-body]]])
  (:import [com.google.appengine.api.memcache MemcacheServiceFactory MemcacheService])
  (:gen-class :extends javax.servlet.http.HttpServlet))

(def ^MemcacheService memcache-service (MemcacheServiceFactory/getMemcacheService))

(defroutes
  rigid
  (GET "/api/sicm/rigid/help" []
    (-> "here is some rigid help (not)" response (content-type "text/plain")))
  (GET "/api/sicm/rigid/evolve" {params :params}
    (log/info "params" params)
    (let [args (for [param [:t :A :B :C]]
                 (Double/valueOf (param params)))
          key (assoc params :kind :rigid-rotation)
          cached (.get memcache-service key)]
      (response
        (if cached
          (do
            (log/info "cache hit")
            cached)
          (do
            (log/info "cache miss")
            (let [data (apply evolve-rigid-body args)]
              (.put memcache-service key data)
              data)))))))

(defservice (-> rigid
              wrap-json-response
              (wrap-defaults api-defaults)))
