(ns net.littleredcomputer.math.api.pendulum
  (:require [clojure.tools.logging :as log]
            [ring.util
             [response :refer [response content-type]]
             [servlet :refer [defservice]]]
            [ring.middleware
             [defaults :refer [wrap-defaults api-defaults]]
             [json :refer [wrap-json-response]]]
            [compojure.core :refer [defroutes GET POST]]
            [hiccup.core :refer :all]
            [net.littleredcomputer.math.examples
             [driven-pendulum :refer [evolve-pendulum]]
             [double-pendulum :refer [evolve-double-pendulum]]])
  (:import [com.google.appengine.api.memcache MemcacheServiceFactory MemcacheService])
  (:gen-class :extends javax.servlet.http.HttpServlet))

(def ^MemcacheService memcache-service (MemcacheServiceFactory/getMemcacheService))

(defroutes
  pendulum
  (GET "/api/sicm/pendulum/help" []
       (-> "here is some help (not)" response (content-type "text/plain")))
  (GET "/api/sicm/pendulum/driven/evolve" {params :params}
       (log/info "params" params)
       (let [args (for [param [:t :A :omega :g :theta0 :thetaDot0]]
                    (Double/valueOf (param params)))
             key (assoc params :kind :driven-pendulum)
             cached (.get memcache-service key)]
         (response
           (if cached
             (do
               (log/info "cache hit")
               cached)
             (do
               (log/info "cache miss")
               (let [data (apply evolve-pendulum args)]
                 (.put memcache-service key data)
                 data))))))
  ;; Yes, this looks repetitive, but we're just brining up these visualizations
  ;; so I'm waiting to see what should be abstracted.
  (GET "/api/sicm/pendulum/double/evolve" {params :params}
       (log/info "params" params)
       (let [args (for [param [:t :g :m1 :l1 :theta0 :thetaDot0 :m2 :l2 :phi0 :phiDot0]]
                    (Double/valueOf (param params)))
             key (assoc params :kind :double-pendulum)
             cached (.get memcache-service key)]
         (response
           (if cached
             (do
               (log/info "cache hit")
               cached)
             (do
               (log/info "cache miss")
               (let [data (apply evolve-double-pendulum args)]
                 (.put memcache-service key data)
                 data)))))))

(defservice (-> pendulum
                wrap-json-response
                (wrap-defaults api-defaults)))

(defn -main [& args]
  (println "HW"))