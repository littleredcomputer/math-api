(ns net.littleredcomputer.math.api.stats
  (:require [clojure.tools.logging :as log]))

(defonce ^:private counters (atom {}))

(defn get-stats
  []
  (into {} (for [[k v] @counters] [k @v])))

(defn make-counter
  [name]
  (let [counter (atom 0)]
    (swap! counters
           (fn [c]
             (when (contains? c name)
               (throw (IllegalStateException.
                        (str "cannot redefine counter " name))))
             (assoc c name counter)))
    (fn f
      ([] (f 1))
      ([x] (swap! counter + x)))))

